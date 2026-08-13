/**
 * QR Code Steganography Engine (Dual Layer QR)
 */

import QRCode from 'qrcode';
import { bytesToZeroWidth, zeroWidthToBytes } from './textStego';

export interface QRStegoResult {
  qrDataUrl: string;
  combinedText: string;
}

/**
 * Generate Dual-Layer QR Code
 * Public Text (Scan via phone camera) + Hidden Payload (Zero-width URL fragment or appended payload)
 */
export async function generateDualQRCode(
  publicText: string,
  payloadBytes: Uint8Array
): Promise<QRStegoResult> {
  const hiddenSeq = bytesToZeroWidth(payloadBytes);
  
  let combinedText: string;
  if (publicText.startsWith('http://') || publicText.startsWith('https://')) {
    // Append to URL hash anchor fragment (#) so standard browser navigation still opens URL
    const sep = publicText.includes('#') ? '' : '#hbx=';
    combinedText = publicText + sep + hiddenSeq;
  } else {
    combinedText = publicText + hiddenSeq;
  }

  const qrDataUrl = await QRCode.toDataURL(combinedText, {
    errorCorrectionLevel: 'H',
    width: 400,
    margin: 2,
    color: {
      dark: '#0f172a',
      light: '#ffffff'
    }
  });

  return {
    qrDataUrl,
    combinedText
  };
}

/**
 * Extract Hidden Payload from decoded QR code string
 */
export function extractQRStegoPayload(scannedText: string): Uint8Array {
  const bytes = zeroWidthToBytes(scannedText);
  if (bytes.length === 0) {
    throw new Error('二维码明文中未包含 HiddenBox 零宽隐写载荷');
  }
  return bytes;
}
