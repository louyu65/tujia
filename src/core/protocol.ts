/**
 * HiddenBox Protocol Specification (HBX v1.0)
 * 
 * Packet Structure:
 * ┌──────────┬─────────┬──────────────┬───────────────────┬───────────────┬────────────────┐
 * │  Magic   │ Version │ Flags        │ Payload Type      │ Payload Len   │ Encrypted      │
 * │ ("HBX1") │ (1 B)   │ (Enc/Comp 1B)│ (Text/File/Json)  │ (4 Bytes BE)  │ Payload & CRC  │
 * └──────────┴─────────┴──────────────┴───────────────────┴───────────────┴────────────────┘
 */

export enum PayloadType {
  TEXT = 0x01,
  FILE = 0x02,
  JSON = 0x03,
  AGENT_CMD = 0x04
}

export interface ProtocolHeader {
  magic: string;          // 'HBX1'
  version: number;        // 1
  isEncrypted: boolean;   // AES-GCM
  isCompressed: boolean;  // Deflate / Basic RLE
  payloadType: PayloadType;
  payloadLength: number;
}

export interface UnpackResult {
  header: ProtocolHeader;
  payloadText?: string;
  payloadFile?: {
    name: string;
    type: string;
    data: Uint8Array;
  };
  payloadJson?: any;
  rawPayload: Uint8Array;
}

// CRC32 Calculation
export function crc32(buffer: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < buffer.length; i++) {
    let byte = buffer[i];
    crc ^= byte;
    for (let j = 0; j < 8; j++) {
      let mask = -(crc & 1);
      crc = (crc >>> 1) ^ (0xedb88320 & mask);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

// Helper to convert Uint8Array view to standalone ArrayBuffer for Web Crypto API
function toArrayBuffer(buf: Uint8Array): ArrayBuffer {
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
}

// Simple XOR / Web Crypto Password Key derivation for AES-GCM
async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: toArrayBuffer(salt),
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encapsulate payload into HiddenBox Binary Protocol Buffer
 */
export async function packPayload(
  data: string | Uint8Array,
  type: PayloadType = PayloadType.TEXT,
  password?: string,
  fileName?: string
): Promise<Uint8Array> {
  const encoder = new TextEncoder();
  let rawBytes: Uint8Array;

  if (type === PayloadType.TEXT || type === PayloadType.JSON) {
    const textStr = typeof data === 'string' ? data : new TextDecoder().decode(data);
    rawBytes = encoder.encode(textStr);
  } else if (type === PayloadType.FILE) {
    const fileData = typeof data === 'string' ? encoder.encode(data) : data;
    const nameBytes = encoder.encode(fileName || 'payload.bin');
    const nameLen = nameBytes.length;
    // Format: [1 byte nameLen][nameBytes][fileBytes]
    const fileBuffer = new Uint8Array(1 + nameLen + fileData.length);
    fileBuffer[0] = nameLen;
    fileBuffer.set(nameBytes, 1);
    fileBuffer.set(fileData, 1 + nameLen);
    rawBytes = fileBuffer;
  } else {
    rawBytes = typeof data === 'string' ? encoder.encode(data) : data;
  }

  let finalPayload = rawBytes;
  let isEncrypted = false;

  if (password && password.trim() !== '') {
    isEncrypted = true;
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await deriveKey(password, salt);
    const encryptedBuf = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: toArrayBuffer(iv) },
      key,
      toArrayBuffer(rawBytes)
    );
    const encryptedBytes = new Uint8Array(encryptedBuf);
    
    // [16 bytes salt][12 bytes iv][encrypted data]
    const encBuffer = new Uint8Array(16 + 12 + encryptedBytes.length);
    encBuffer.set(salt, 0);
    encBuffer.set(iv, 16);
    encBuffer.set(encryptedBytes, 28);
    finalPayload = encBuffer;
  }

  // Header assembly: [HBX1 (4B)][Version (1B)][Flags (1B)][Type (1B)][Length (4B)][CRC32 (4B)][Payload]
  const checksum = crc32(finalPayload);
  const headerBuf = new Uint8Array(15);
  const magic = encoder.encode('HBX1');
  headerBuf.set(magic, 0);
  headerBuf[4] = 0x01; // Version 1
  headerBuf[5] = (isEncrypted ? 0x01 : 0x00); // Flags
  headerBuf[6] = type;
  
  // Length (4 bytes Big Endian)
  const view = new DataView(headerBuf.buffer);
  view.setUint32(7, finalPayload.length, false);
  view.setUint32(11, checksum, false);

  const packet = new Uint8Array(headerBuf.length + finalPayload.length);
  packet.set(headerBuf, 0);
  packet.set(finalPayload, 15);

  return packet;
}

/**
 * Unpack payload from HiddenBox Protocol Buffer
 */
export async function unpackPayload(
  packet: Uint8Array,
  password?: string
): Promise<UnpackResult> {
  if (packet.length < 15) {
    throw new Error('无效的 HiddenBox 数据包：数据过短');
  }

  const decoder = new TextDecoder();
  const magic = decoder.decode(packet.subarray(0, 4));
  if (magic !== 'HBX1') {
    throw new Error(`非 HiddenBox 协议数据 (Magic: ${magic})`);
  }

  const version = packet[4];
  const flags = packet[5];
  const isEncrypted = (flags & 0x01) !== 0;
  const payloadType = packet[6] as PayloadType;

  const view = new DataView(packet.buffer, packet.byteOffset, packet.byteLength);
  const payloadLen = view.getUint32(7, false);
  const expectedCrc = view.getUint32(11, false);

  const rawPayload = packet.subarray(15, 15 + payloadLen);
  
  const calculatedCrc = crc32(rawPayload);
  if (calculatedCrc !== expectedCrc) {
    throw new Error(`HiddenBox 校验码错误 (Expected: ${expectedCrc.toString(16)}, Got: ${calculatedCrc.toString(16)})`);
  }

  let decryptedPayload = rawPayload;
  if (isEncrypted) {
    if (!password) {
      throw new Error('该数据载荷已加密，请输入密码进行解密');
    }
    if (rawPayload.length < 28) {
      throw new Error('加密数据包损坏');
    }
    const salt = rawPayload.subarray(0, 16);
    const iv = rawPayload.subarray(16, 28);
    const cipherData = rawPayload.subarray(28);

    const key = await deriveKey(password, salt);
    try {
      const decryptedBuf = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: toArrayBuffer(iv) },
        key,
        toArrayBuffer(cipherData)
      );
      decryptedPayload = new Uint8Array(decryptedBuf);
    } catch (e) {
      throw new Error('密码错误或密文损坏，解密失败');
    }
  }

  const result: UnpackResult = {
    header: {
      magic,
      version,
      isEncrypted,
      isCompressed: false,
      payloadType,
      payloadLength: decryptedPayload.length
    },
    rawPayload: decryptedPayload
  };

  if (payloadType === PayloadType.TEXT || payloadType === PayloadType.AGENT_CMD) {
    result.payloadText = decoder.decode(decryptedPayload);
  } else if (payloadType === PayloadType.JSON) {
    try {
      result.payloadJson = JSON.parse(decoder.decode(decryptedPayload));
      result.payloadText = JSON.stringify(result.payloadJson, null, 2);
    } catch {
      result.payloadText = decoder.decode(decryptedPayload);
    }
  } else if (payloadType === PayloadType.FILE) {
    const nameLen = decryptedPayload[0];
    const name = decoder.decode(decryptedPayload.subarray(1, 1 + nameLen));
    const fileBytes = decryptedPayload.subarray(1 + nameLen);
    result.payloadFile = {
      name,
      type: 'application/octet-stream',
      data: fileBytes
    };
  }

  return result;
}
