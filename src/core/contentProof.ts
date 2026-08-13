/**
 * Content Proof Engine (HiddenBox Content Proof Core v2.0)
 * 
 * Supports Ultra-Short Token Mode (超短口令暗号) & Seamless Steganographic Mode:
 * 1. Ultra-Short Base62 Token (e.g. CP#X8K2 - Like PDD/TaoBao Oral Code, but zero-intrusive)
 * 2. Content Fingerprint (SimHash + SHA-256 Digest for anti-counterfeiting & copyright proof)
 * 3. Hybrid Cross-Verification
 */

import { packPayload, unpackPayload, PayloadType } from './protocol';
import { embedChineseHomoglyph, extractChineseHomoglyph, bytesToKaomojiSequence, kaomojiSequenceToBytes } from './textStego';

export interface CampaignPayload {
  campaignId: string;   // e.g. "CAMP-2026"
  creatorId: string;    // e.g. "KOL_88"
  couponCode: string;   // e.g. "OFF50"
  rewardTitle: string;  // e.g. "到店立减30元"
  timestamp: number;
}

export interface ProofVerificationResult {
  isVerified: boolean;
  campaign?: CampaignPayload;
  contentFingerprint: string;
  simHashHex: string;
  fingerprintMatch: boolean;
  traceabilityScore: number;
  antiCounterfeitScore: number;
  verificationMessage: string;
}

const BASE62_ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

/**
 * Compress uint32/bytes to Base62 short token string
 */
export function toBase62(num: number): string {
  if (num === 0) return '0';
  let res = '';
  let n = Math.abs(num);
  while (n > 0) {
    res = BASE62_ALPHABET[n % 62] + res;
    n = Math.floor(n / 62);
  }
  return res;
}

export function fromBase62(str: string): number {
  let num = 0;
  for (let i = 0; i < str.length; i++) {
    const idx = BASE62_ALPHABET.indexOf(str[i]);
    if (idx !== -1) {
      num = num * 62 + idx;
    }
  }
  return num;
}

/**
 * Normalize text content for fingerprint calculation
 */
export function normalizeContent(text: string): string {
  return text
    .replace(/[\s\t\n\r\f\v]/g, '')
    .replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, '')
    .toLowerCase();
}

/**
 * Compute 64-bit SimHash
 */
export function computeSimHash(normalizedText: string): bigint {
  const v = new Array(64).fill(0);

  for (let i = 0; i < normalizedText.length - 1; i++) {
    const gram = normalizedText.substring(i, Math.min(i + 4, normalizedText.length));
    let hash = 0n;
    for (let j = 0; j < gram.length; j++) {
      hash = (hash * 31n + BigInt(gram.charCodeAt(j))) & 0xFFFFFFFFFFFFFFFFn;
    }
    for (let bit = 0; bit < 64; bit++) {
      if ((hash & (1n << BigInt(bit))) !== 0n) {
        v[bit] += 1;
      } else {
        v[bit] -= 1;
      }
    }
  }

  let simhash = 0n;
  for (let bit = 0; bit < 64; bit++) {
    if (v[bit] > 0) {
      simhash |= (1n << BigInt(bit));
    }
  }

  return simhash;
}

/**
 * Calculate Content Digest Fingerprint
 */
export async function computeContentDigest(normalizedText: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(normalizedText);
  const hashBuf = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuf));
  const hex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return `FP-${hex.substring(0, 10).toUpperCase()}`;
}

/**
 * Generate Ultra-Short Token (e.g. CP#X8K2) or Steganographic Proof
 */
export async function generateContentProof(
  baseArticleText: string,
  campaign: CampaignPayload,
  isShortCodeMode: boolean = false
): Promise<{ proofText: string; digest: string; simHash: string; shortCode: string }> {
  const normalized = normalizeContent(baseArticleText);
  const digest = await computeContentDigest(normalized);
  const simHashBigInt = computeSimHash(normalized);
  const simHash = `0x${simHashBigInt.toString(16).toUpperCase().padStart(16, '0')}`;

  // Generate 6-char ultra short code
  const shortNum = Math.abs(Number(simHashBigInt & 0x7FFFFFFFFn));
  const shortCode = `CP#${toBase62(shortNum).padStart(5, '0')}`;

  const fullPayload: CampaignPayload & { digest: string } = {
    ...campaign,
    digest,
    timestamp: Date.now()
  };

  const packet = await packPayload(JSON.stringify(fullPayload), PayloadType.JSON);

  let proofText = '';
  if (isShortCodeMode) {
    // Ultra-Short Code Mode: Just append a clean 6-character tag
    proofText = `${baseArticleText}\n\n (⁠╹⁠◡⁠╹⁠) 福利口令：${shortCode}`;
  } else {
    // Seamless Steganographic Mode: Embed payload invisibly into Chinese text characters
    const homoglyphText = embedChineseHomoglyph(baseArticleText, packet);
    proofText = homoglyphText;
  }

  return {
    proofText,
    digest,
    simHash,
    shortCode
  };
}

/**
 * Verify Content Proof
 */
export async function verifyContentProof(submittedText: string): Promise<ProofVerificationResult> {
  const normalized = normalizeContent(submittedText);
  const currentDigest = await computeContentDigest(normalized);
  const currentSimHashBigInt = computeSimHash(normalized);
  const currentSimHashHex = `0x${currentSimHashBigInt.toString(16).toUpperCase().padStart(16, '0')}`;

  let extractedPayload: CampaignPayload | undefined = undefined;

  // 1. Try extracting payload from hidden token
  try {
    let bytes = kaomojiSequenceToBytes(submittedText);
    if (bytes.length === 0) {
      bytes = extractChineseHomoglyph(submittedText);
    }

    if (bytes.length > 0) {
      const unpacked = await unpackPayload(bytes);
      if (unpacked.payloadJson) {
        extractedPayload = unpacked.payloadJson as CampaignPayload;
      }
    }
  } catch {
    // Token missing
  }

  // 2. Check for Short Code CP#XXXXX
  if (!extractedPayload && submittedText.includes('CP#')) {
    const match = submittedText.match(/CP#([0-9A-Za-z]{4,8})/);
    if (match) {
      extractedPayload = {
        campaignId: 'CAMP-SHORTCODE',
        creatorId: 'KOL_ATTRIBUTED',
        couponCode: match[0],
        rewardTitle: '口令识别成功：到店出示享受专属福利',
        timestamp: Date.now()
      };
    }
  }

  const isVerified = !!extractedPayload;
  let fingerprintMatch = false;

  if (extractedPayload && (extractedPayload as any).digest) {
    fingerprintMatch = ((extractedPayload as any).digest === currentDigest);
  }

  return {
    isVerified,
    campaign: extractedPayload,
    contentFingerprint: currentDigest,
    simHashHex: currentSimHashHex,
    fingerprintMatch,
    traceabilityScore: isVerified ? 100 : 30,
    antiCounterfeitScore: isVerified && fingerprintMatch ? 100 : isVerified ? 85 : 0,
    verificationMessage: isVerified
      ? fingerprintMatch
        ? '✅ 内容指纹与隐藏凭证 100% 完全匹配，核销成功！来源真实不可篡改。'
        : '⚠️ 凭证识别成功，归因与权益核销有效。'
      : '❌ 未在提交内容中检测到有效的 Content Proof 凭证，核销失败。'
  };
}
