/**
 * Image Steganography Engine (HiddenBox Image Core)
 * 
 * Supports:
 * 1. LSB (Least Significant Bit) Pixel Encoding & Decoding on RawPixelData / ImageData
 * 2. Polyglot File Container (Appending Payload to Image End Boundary)
 * 3. Image Capacity Calculator
 * 4. Cross-Platform Engine (DOM Canvas & Cloudflare Workers compatible)
 */

import { RawPixelData } from './canvasAdapter';

export interface ImageCapacity {
  width: number;
  height: number;
  totalPixels: number;
  maxBytesLSB1: number; // 1-bit LSB per RGB channel
  maxBytesLSB2: number; // 2-bit LSB per RGB channel
}

/**
 * Calculate maximum LSB steganography capacity for an image
 */
export function calculateImageCapacity(width: number, height: number): ImageCapacity {
  const totalPixels = width * height;
  const maxBytesLSB1 = Math.floor((totalPixels * 3) / 8);
  const maxBytesLSB2 = Math.floor((totalPixels * 3 * 2) / 8);

  return {
    width,
    height,
    totalPixels,
    maxBytesLSB1,
    maxBytesLSB2
  };
}

/**
 * Embed binary payload buffer into RawPixelData / ImageData via LSB
 */
export function embedLSBPayload<T extends RawPixelData | ImageData>(
  imageData: T,
  payload: Uint8Array,
  bitsPerChannel: number = 1
): T {
  const data = new Uint8Array(imageData.data.buffer, imageData.data.byteOffset, imageData.data.byteLength);
  const width = imageData.width;
  const height = imageData.height;
  const totalCapacity = Math.floor((width * height * 3 * bitsPerChannel) / 8);

  const packetLen = 4 + payload.length;
  if (packetLen > totalCapacity) {
    throw new Error(`隐藏载荷尺寸 (${packetLen} B) 超过图片最大容量 (${totalCapacity} B)`);
  }

  const fullPacket = new Uint8Array(packetLen);
  const view = new DataView(fullPacket.buffer);
  view.setUint32(0, payload.length, false);
  fullPacket.set(payload, 4);

  let bitIndex = 0;
  const totalBits = packetLen * 8;

  for (let i = 0; i < data.length && bitIndex < totalBits; i++) {
    // Skip Alpha channel
    if ((i + 1) % 4 === 0) continue;

    let byteVal = data[i];
    
    if (bitsPerChannel === 1) {
      const bit = (fullPacket[Math.floor(bitIndex / 8)] >> (7 - (bitIndex % 8))) & 1;
      byteVal = (byteVal & 0xFE) | bit;
      bitIndex++;
    } else if (bitsPerChannel === 2) {
      if (bitIndex + 1 < totalBits) {
        const b1 = (fullPacket[Math.floor(bitIndex / 8)] >> (7 - (bitIndex % 8))) & 1;
        const b2 = (fullPacket[Math.floor((bitIndex + 1) / 8)] >> (7 - ((bitIndex + 1) % 8))) & 1;
        const twoBits = (b1 << 1) | b2;
        byteVal = (byteVal & 0xFC) | twoBits;
        bitIndex += 2;
      } else {
        const bit = (fullPacket[Math.floor(bitIndex / 8)] >> (7 - (bitIndex % 8))) & 1;
        byteVal = (byteVal & 0xFE) | bit;
        bitIndex++;
      }
    }

    data[i] = byteVal;
  }

  return imageData;
}

/**
 * Extract binary payload buffer from RawPixelData / ImageData via LSB
 */
export function extractLSBPayload(
  imageData: RawPixelData | ImageData,
  bitsPerChannel: number = 1
): Uint8Array {
  const data = new Uint8Array(imageData.data.buffer, imageData.data.byteOffset, imageData.data.byteLength);
  
  const lengthBits: number[] = [];
  let byteIndex = 0;

  for (let i = 0; i < data.length && lengthBits.length < 32; i++) {
    if ((i + 1) % 4 === 0) continue;
    const byteVal = data[i];

    if (bitsPerChannel === 1) {
      lengthBits.push(byteVal & 1);
    } else if (bitsPerChannel === 2) {
      lengthBits.push((byteVal >> 1) & 1);
      if (lengthBits.length < 32) {
        lengthBits.push(byteVal & 1);
      }
    }
    byteIndex = i + 1;
  }

  let payloadLen = 0;
  for (let i = 0; i < 32; i++) {
    payloadLen = (payloadLen << 1) | lengthBits[i];
  }

  if (payloadLen <= 0 || payloadLen > 50 * 1024 * 1024) {
    throw new Error('未在图片中检测到有效的 LSB 隐藏载荷');
  }

  const totalPayloadBits = payloadLen * 8;
  const payloadBits: number[] = [];

  for (let i = byteIndex; i < data.length && payloadBits.length < totalPayloadBits; i++) {
    if ((i + 1) % 4 === 0) continue;
    const byteVal = data[i];

    if (bitsPerChannel === 1) {
      payloadBits.push(byteVal & 1);
    } else if (bitsPerChannel === 2) {
      payloadBits.push((byteVal >> 1) & 1);
      if (payloadBits.length < totalPayloadBits) {
        payloadBits.push(byteVal & 1);
      }
    }
  }

  if (payloadBits.length < totalPayloadBits) {
    throw new Error('隐写数据被截断或损坏');
  }

  const payload = new Uint8Array(payloadLen);
  for (let i = 0; i < payloadLen; i++) {
    let byteVal = 0;
    for (let bit = 0; bit < 8; bit++) {
      byteVal = (byteVal << 1) | payloadBits[i * 8 + bit];
    }
    payload[i] = byteVal;
  }

  return payload;
}

/**
 * Polyglot Image Container: Append payload to image file end boundary
 */
export function embedImageContainer(
  imageBytes: Uint8Array,
  payloadBytes: Uint8Array
): Uint8Array {
  const marker = new TextEncoder().encode('HBXC');
  const lenBuf = new Uint8Array(4);
  new DataView(lenBuf.buffer).setUint32(0, payloadBytes.length, false);

  const result = new Uint8Array(imageBytes.length + marker.length + payloadBytes.length + 4);
  result.set(imageBytes, 0);
  result.set(marker, imageBytes.length);
  result.set(payloadBytes, imageBytes.length + marker.length);
  result.set(lenBuf, imageBytes.length + marker.length + payloadBytes.length);

  return result;
}

/**
 * Extract Polyglot payload appended to image file end
 */
export function extractImageContainer(fileBytes: Uint8Array): Uint8Array {
  if (fileBytes.length < 12) {
    throw new Error('文件尺寸太小，未包含有效的容器载荷');
  }

  const view = new DataView(fileBytes.buffer, fileBytes.byteOffset, fileBytes.byteLength);
  const payloadLen = view.getUint32(fileBytes.length - 4, false);

  const markerPos = fileBytes.length - 4 - payloadLen - 4;
  if (markerPos < 0) {
    throw new Error('未在文件尾部检测到图片封装容器标记');
  }

  const marker = new TextDecoder().decode(fileBytes.subarray(markerPos, markerPos + 4));
  if (marker !== 'HBXC') {
    throw new Error('未包含有效的 HiddenBox Container (HBXC) 追加封装数据');
  }

  return fileBytes.subarray(markerPos + 4, markerPos + 4 + payloadLen);
}
