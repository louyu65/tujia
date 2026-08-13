/**
 * Text Steganography Engine (HiddenBox Text Core v2.2)
 * 
 * Rich Expressive Social Steganography Engines (100% IM Safe):
 * 1. Emoji Cipher Sequence (Standard Emojis)
 * 2. Kaomoji Cipher Sequence (颜文字暗号流 - (๑•̀ㅂ•́)و✧ 毫无违和感)
 * 3. Internet Slang & Cyber Symbol Cipher (网络热梗/符号暗号 - 🐮🍺🔥✨🎉🚀)
 * 4. Chinese Homoglyph
 * 5. Latin Homoglyph
 * 6. Zero-Width
 */

export enum TextStegoMode {
  CN_HOMOGLYPH = 'cn-homoglyph',        // 微信/钉钉推荐：中文汉字/部首同形字
  EMOJI_CIPHER = 'emoji-cipher',        // 微信/钉钉推荐：Standard Emoji 表情序列 (😀~🤩)
  KAOMOJI_CIPHER = 'kaomoji-cipher',    // 微信/钉钉推荐：颜文字组合暗号 (๑•̀ㅂ•́)و✧ (社交感极强)
  CYBER_SYMBOL = 'cyber-symbol',        // 微信/钉钉推荐：爆款社交符号流 (🐮🍺🔥✨🎉🚀...)
  EN_HOMOGLYPH = 'en-homoglyph',        // 英文同形字
  PUNCTUATION = 'punctuation',          // 标点空格组合
  ZERO_WIDTH = 'zero-width',            // 经典零宽
  VARIATION_SELECTOR = 'variation-selector',
  WHITESPACE = 'whitespace'
}

// Unicode Constants for Zero-Width
export const ZW_CHARS = {
  ZWS: '\u200B',  // Zero Width Space
  ZWNJ: '\u200C', // Zero Width Non-Joiner
  ZWJ: '\u200D',  // Zero Width Joiner
  WJ: '\u2060'    // Word Joiner
};

export const ZW_MAP_ENCODE: Record<string, string> = {
  '00': ZW_CHARS.ZWS,
  '01': ZW_CHARS.ZWNJ,
  '10': ZW_CHARS.ZWJ,
  '11': ZW_CHARS.WJ
};

export const ZW_MAP_DECODE: Record<string, string> = {
  [ZW_CHARS.ZWS]: '00',
  [ZW_CHARS.ZWNJ]: '01',
  [ZW_CHARS.ZWJ]: '10',
  [ZW_CHARS.WJ]: '11'
};

// 1. Emoji Dictionary (16 Hex Nybbles)
export const EMOJI_NYBBLES: string[] = [
  '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂',
  '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩'
];
export const EMOJI_REVERSE_MAP: Record<string, number> = {};
EMOJI_NYBBLES.forEach((emoji, idx) => { EMOJI_REVERSE_MAP[emoji] = idx; });

// 2. Kaomoji Dictionary (16 Cute Asian Emoticons)
export const KAOMOJI_NYBBLES: string[] = [
  '(⁠•⁠‿⁠•⁠)', '(⁠^⁠^⁠)', '(⁠^⁠_⁠^⁠)', '(⁠=⁠^⁠･⁠^⁠=⁠)', 
  '(⁠•⁠ө⁠•⁠)', '(⁠♡⁠ω⁠♡⁠)', '(⁠๑⁠•⁠̀⁠ㅂ⁠•⁠́⁠)⁠و', '(⁠≧⁠▽⁠≦⁠)', 
  '(⁠o⁠^⁠^⁠o⁠)', '(⁠^⁠O⁠^⁠)', '(⁠~⁠￣⁠▽⁠￣⁠)⁠~', '(⁠｡⁠･⁠ω⁠･⁠｡⁠)', 
  '(⁠✿⁠^⁠‿⁠^⁠)', '(⁠★⁠ω⁠★⁠)', '(⁠◕⁠‿⁠◕⁠)', '(⁠◡⁠ω⁠◡⁠)'
];
export const KAOMOJI_REVERSE_MAP: Record<string, number> = {};
KAOMOJI_NYBBLES.forEach((kao, idx) => { KAOMOJI_REVERSE_MAP[kao] = idx; });

// 3. Cyber Hot Symbols Dictionary (16 Trending Social Symbols)
export const CYBER_NYBBLES: string[] = [
  '🔥', '✨', '🎉', '🚀', '💯', '👏', '🌟', '💪',
  '🎁', '⚡', '🏆', '💎', '🌈', '🍀', '🎯', '👑'
];
export const CYBER_REVERSE_MAP: Record<string, number> = {};
CYBER_NYBBLES.forEach((sym, idx) => { CYBER_REVERSE_MAP[sym] = idx; });

// Chinese CJK Ideographs vs Kangxi Radical Homoglyphs
export const CN_HOMOGLYPH_PAIRS: Array<{ std: string; alt: string }> = [
  { std: '一', alt: '\u2F00' },
  { std: '丨', alt: '\u2F01' },
  { std: '丶', alt: '\u2F02' },
  { std: '丿', alt: '\u2F03' },
  { std: '乙', alt: '\u2F04' },
  { std: '二', alt: '\u2F06' },
  { std: '人', alt: '\u2F08' },
  { std: '入', alt: '\u2F0A' },
  { std: '八', alt: '\u2F0B' },
  { std: '十', alt: '\u2F17' },
  { std: '卜', alt: '\u2F18' },
  { std: '又', alt: '\u2F1B' },
  { std: '口', alt: '\u2F1D' },
  { std: '土', alt: '\u2F1F' },
  { std: '士', alt: '\u2F20' },
  { std: '大', alt: '\u2F24' },
  { std: '女', alt: '\u2F25' },
  { std: '子', alt: '\u2F26' },
  { std: '寸', alt: '\u2F28' },
  { std: '小', alt: '\u2F29' },
  { std: '工', alt: '\u2F30' },
  { std: '己', alt: '\u2F32' },
  { std: '干', alt: '\u2F33' },
  { std: '弓', alt: '\u2F38' },
  { std: '心', alt: '\u2F3C' },
  { std: '戈', alt: '\u2F3D' },
  { std: '手', alt: '\u2F3F' },
  { std: '日', alt: '\u2F47' },
  { std: '月', alt: '\u2F49' },
  { std: '木', alt: '\u2F4A' },
  { std: '水', alt: '\u2F54' },
  { std: '火', alt: '\u2F55' },
  { std: '田', alt: '\u2F65' },
  { std: '目', alt: '\u2F6C' },
  { std: '石', alt: '\u2F6F' },
  { std: '示', alt: '\u2F70' },
  { std: '立', alt: '\u2F74' },
  { std: '竹', alt: '\u2F75' },
  { std: '米', alt: '\u2F76' },
  { std: '糸', alt: '\u2F77' },
  { std: '羊', alt: '\u2F7B' },
  { std: '羽', alt: '\u2F7C' },
  { std: '老', alt: '\u2F7D' },
  { std: '而', alt: '\u2F7E' },
  { std: '耳', alt: '\u2F7F' },
  { std: '自', alt: '\u2F83' },
  { std: '至', alt: '\u2F84' },
  { std: '臼', alt: '\u2F85' },
  { std: '舌', alt: '\u2F86' },
  { std: '舟', alt: '\u2F88' },
  { std: '艮', alt: '\u2F89' },
  { std: '色', alt: '\u2F8A' },
  { std: '草', alt: '\u2F8B' },
  { std: '虫', alt: '\u2F8D' },
  { std: '血', alt: '\u2F8E' },
  { std: '行', alt: '\u2F8F' },
  { std: '衣', alt: '\u2F90' },
  { std: '角', alt: '\u2F92' },
  { std: '言', alt: '\u2F93' },
  { std: '谷', alt: '\u2F94' },
  { std: '豆', alt: '\u2F95' },
  { std: '豕', alt: '\u2F96' },
  { std: '豸', alt: '\u2F97' },
  { std: '贝', alt: '\u2F98' },
  { std: '赤', alt: '\u2F99' },
  { std: '走', alt: '\u2F9A' },
  { std: '足', alt: '\u2F9B' },
  { std: '身', alt: '\u2F9C' },
  { std: '车', alt: '\u2F9D' },
  { std: '辛', alt: '\u2F9E' },
  { std: '辰', alt: '\u2F9F' },
  { std: '邑', alt: '\u2FA0' },
  { std: '酉', alt: '\u2FA1' },
  { std: '门', alt: '\u2FA3' },
  { std: '金', alt: '\u2FA2' },
  { std: '长', alt: '\u2FA4' },
  { std: '非', alt: '\u2FA8' },
  { std: '音', alt: '\u2FAA' },
  { std: '页', alt: '\u2FAB' },
  { std: '风', alt: '\u2FAC' },
  { std: '飞', alt: '\u2FAD' },
  { std: '食', alt: '\u2FAE' },
  { std: '香', alt: '\u2FAF' },
  { std: '马', alt: '\u2FB0' },
  { std: '骨', alt: '\u2FB1' },
  { std: '高', alt: '\u2FB2' },
  { std: '髟', alt: '\u2FB3' },
  { std: '斗', alt: '\u2F43' },
  { std: '斤', alt: '\u2F44' },
  { std: '方', alt: '\u2F45' },
  { std: '无', alt: '\u2F46' }
];

export const CN_ENCODE_MAP: Record<string, { std: string; alt: string }> = {};
export const CN_DECODE_MAP: Record<string, string> = {};

CN_HOMOGLYPH_PAIRS.forEach(pair => {
  CN_ENCODE_MAP[pair.std] = pair;
  CN_DECODE_MAP[pair.std] = '0';
  CN_DECODE_MAP[pair.alt] = '1';
});

// Latin Homoglyph Map
export const HOMOGLYPH_MAP: Record<string, { std: string; alt: string }> = {
  a: { std: 'a', alt: '\u0430' },
  c: { std: 'c', alt: '\u0441' },
  e: { std: 'e', alt: '\u0435' },
  o: { std: 'o', alt: '\u043E' },
  p: { std: 'p', alt: '\u0440' },
  x: { std: 'x', alt: '\u0445' },
  y: { std: 'y', alt: '\u0443' },
  A: { std: 'A', alt: '\u0410' },
  B: { std: 'B', alt: '\u0412' },
  C: { std: 'C', alt: '\u0421' },
  E: { std: 'E', alt: '\u0415' },
  H: { std: 'H', alt: '\u041D' },
  K: { std: 'K', alt: '\u041A' },
  M: { std: 'M', alt: '\u041C' },
  O: { std: 'O', alt: '\u041E' },
  P: { std: 'P', alt: '\u0420' },
  T: { std: 'T', alt: '\u0422' },
  X: { std: 'X', alt: '\u0425' }
};

export const HOMOGLYPH_DECODE_MAP: Record<string, string> = {};
Object.entries(HOMOGLYPH_MAP).forEach(([_, val]) => {
  HOMOGLYPH_DECODE_MAP[val.std] = '0';
  HOMOGLYPH_DECODE_MAP[val.alt] = '1';
});

export interface InvisibleCharToken {
  index: number;
  char: string;
  codePoint: string;
  name: string;
  type: 'zero-width' | 'variation-selector' | 'special-space' | 'homoglyph' | 'normal';
}

/**
 * Kaomoji Cipher Sequence Steganography (颜文字暗号流)
 */
export function bytesToKaomojiSequence(bytes: Uint8Array): string {
  let result = ' (⁠╹⁠◡⁠╹⁠) ';
  for (let i = 0; i < bytes.length; i++) {
    const high = (bytes[i] >> 4) & 0x0f;
    const low = bytes[i] & 0x0f;
    result += KAOMOJI_NYBBLES[high] + ' ' + KAOMOJI_NYBBLES[low] + ' ';
  }
  return result.trim();
}

export function kaomojiSequenceToBytes(text: string): Uint8Array {
  const nybbles: number[] = [];
  
  // Sort Kaomojis by length descending to match correctly
  const sortedKaomojis = [...KAOMOJI_NYBBLES].sort((a, b) => b.length - a.length);

  let pos = 0;
  while (pos < text.length) {
    let matched = false;
    for (const kao of sortedKaomojis) {
      if (text.startsWith(kao, pos)) {
        const val = KAOMOJI_REVERSE_MAP[kao];
        if (val !== undefined) {
          nybbles.push(val);
          pos += kao.length;
          matched = true;
          break;
        }
      }
    }
    if (!matched) pos++;
  }

  const bytes = new Uint8Array(Math.floor(nybbles.length / 2));
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = (nybbles[i * 2] << 4) | nybbles[i * 2 + 1];
  }
  return bytes;
}

/**
 * Cyber Symbol Cipher Sequence Steganography (爆款社交符号流)
 */
export function bytesToCyberSequence(bytes: Uint8Array): string {
  let result = '🔥';
  for (let i = 0; i < bytes.length; i++) {
    const high = (bytes[i] >> 4) & 0x0f;
    const low = bytes[i] & 0x0f;
    result += CYBER_NYBBLES[high] + CYBER_NYBBLES[low];
  }
  return result;
}

export function cyberSequenceToBytes(text: string): Uint8Array {
  const nybbles: number[] = [];
  const chars = Array.from(text);

  for (const char of chars) {
    const val = CYBER_REVERSE_MAP[char];
    if (val !== undefined) {
      nybbles.push(val);
    }
  }

  const bytes = new Uint8Array(Math.floor(nybbles.length / 2));
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = (nybbles[i * 2] << 4) | nybbles[i * 2 + 1];
  }
  return bytes;
}

/**
 * Chinese Character Homoglyph Steganography
 */
export function embedChineseHomoglyph(coverText: string, bytes: Uint8Array): string {
  let bits = '';
  for (let i = 0; i < bytes.length; i++) {
    bits += bytes[i].toString(2).padStart(8, '0');
  }

  let bitIdx = 0;
  let result = '';

  for (let i = 0; i < coverText.length; i++) {
    const char = coverText[i];
    const pair = CN_ENCODE_MAP[char];

    if (pair && bitIdx < bits.length) {
      const bit = bits[bitIdx];
      result += bit === '1' ? pair.alt : pair.std;
      bitIdx++;
    } else {
      result += char;
    }
  }

  if (bitIdx < bits.length) {
    result += '【隐】';
    let padIndex = 0;
    while (bitIdx < bits.length) {
      const pair = CN_HOMOGLYPH_PAIRS[padIndex % CN_HOMOGLYPH_PAIRS.length];
      const bit = bits[bitIdx];
      result += bit === '1' ? pair.alt : pair.std;
      bitIdx++;
      padIndex++;
    }
  }

  return result;
}

export function extractChineseHomoglyph(text: string): Uint8Array {
  let bits = '';
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const bit = CN_DECODE_MAP[char];
    if (bit !== undefined) {
      bits += bit;
    }
  }

  const byteCount = Math.floor(bits.length / 8);
  const bytes = new Uint8Array(byteCount);
  for (let i = 0; i < byteCount; i++) {
    bytes[i] = parseInt(bits.substring(i * 8, (i + 1) * 8), 2);
  }

  return bytes;
}

/**
 * Emoji Cipher Sequence Steganography
 */
export function bytesToEmojiSequence(bytes: Uint8Array): string {
  let result = '💬';
  for (let i = 0; i < bytes.length; i++) {
    const high = (bytes[i] >> 4) & 0x0f;
    const low = bytes[i] & 0x0f;
    result += EMOJI_NYBBLES[high] + EMOJI_NYBBLES[low];
  }
  return result;
}

export function emojiSequenceToBytes(text: string): Uint8Array {
  const nybbles: number[] = [];
  const emojis = Array.from(text);

  for (const char of emojis) {
    const val = EMOJI_REVERSE_MAP[char];
    if (val !== undefined) {
      nybbles.push(val);
    }
  }

  const bytes = new Uint8Array(Math.floor(nybbles.length / 2));
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = (nybbles[i * 2] << 4) | nybbles[i * 2 + 1];
  }
  return bytes;
}

/**
 * Latin Homoglyph Steganography
 */
export function embedHomoglyph(coverText: string, bytes: Uint8Array): string {
  let bits = '';
  for (let i = 0; i < bytes.length; i++) {
    bits += bytes[i].toString(2).padStart(8, '0');
  }

  let bitIdx = 0;
  let result = '';

  for (let i = 0; i < coverText.length; i++) {
    const char = coverText[i];
    const match = HOMOGLYPH_MAP[char];

    if (match && bitIdx < bits.length) {
      const bit = bits[bitIdx];
      result += bit === '1' ? match.alt : match.std;
      bitIdx++;
    } else {
      result += char;
    }
  }

  const paddingChars = ['a', 'c', 'e', 'o', 'p', 'x', 'y'];
  let padIdx = 0;
  while (bitIdx < bits.length) {
    const char = paddingChars[padIdx % paddingChars.length];
    const match = HOMOGLYPH_MAP[char];
    const bit = bits[bitIdx];
    result += bit === '1' ? match.alt : match.std;
    bitIdx++;
    padIdx++;
  }

  return result;
}

export function extractHomoglyph(text: string): Uint8Array {
  let bits = '';
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const bit = HOMOGLYPH_DECODE_MAP[char];
    if (bit !== undefined) {
      bits += bit;
    }
  }

  const bytes = new Uint8Array(Math.floor(bits.length / 8));
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(bits.substring(i * 8, (i + 1) * 8), 2);
  }
  return bytes;
}

/**
 * Punctuation Steganography
 */
export function embedPunctuationStego(coverText: string, bytes: Uint8Array): string {
  let bits = '';
  for (let i = 0; i < bytes.length; i++) {
    bits += bytes[i].toString(2).padStart(8, '0');
  }

  let bitIdx = 0;
  let result = '';

  for (let i = 0; i < coverText.length; i++) {
    const char = coverText[i];
    if (['，', '。', '！', '？', ',', '.', '!', '?'].includes(char) && bitIdx < bits.length) {
      const bit = bits[bitIdx];
      result += char + (bit === '1' ? '\u00A0' : '');
      bitIdx++;
    } else {
      result += char;
    }
  }

  while (bitIdx < bits.length) {
    const bit = bits[bitIdx];
    result += '，' + (bit === '1' ? '\u00A0' : '');
    bitIdx++;
  }

  return result;
}

export function extractPunctuationStego(text: string): Uint8Array {
  let bits = '';
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (['，', '。', '！', '？', ',', '.', '!', '?'].includes(char)) {
      const nextChar = text[i + 1];
      if (nextChar === '\u00A0') {
        bits += '1';
        i++;
      } else {
        bits += '0';
      }
    }
  }

  const bytes = new Uint8Array(Math.floor(bits.length / 8));
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(bits.substring(i * 8, (i + 1) * 8), 2);
  }
  return bytes;
}

/**
 * Zero-Width Character Steganography
 */
export function bytesToZeroWidth(bytes: Uint8Array): string {
  let result = '';
  for (let i = 0; i < bytes.length; i++) {
    const byte = bytes[i];
    const b1 = ((byte >> 6) & 3).toString(2).padStart(2, '0');
    const b2 = ((byte >> 4) & 3).toString(2).padStart(2, '0');
    const b3 = ((byte >> 2) & 3).toString(2).padStart(2, '0');
    const b4 = (byte & 3).toString(2).padStart(2, '0');
    result += ZW_MAP_ENCODE[b1] + ZW_MAP_ENCODE[b2] + ZW_MAP_ENCODE[b3] + ZW_MAP_ENCODE[b4];
  }
  return result;
}

export function zeroWidthToBytes(str: string): Uint8Array {
  let bits = '';
  for (const char of str) {
    if (ZW_MAP_DECODE[char]) {
      bits += ZW_MAP_DECODE[char];
    }
  }

  const bytes = new Uint8Array(Math.floor(bits.length / 8));
  for (let i = 0; i < bytes.length; i++) {
    const byteBits = bits.substring(i * 8, (i + 1) * 8);
    bytes[i] = parseInt(byteBits, 2);
  }
  return bytes;
}

export function embedZeroWidthText(coverText: string, payloadBytes: Uint8Array, insertPosition: number = 0): string {
  const hiddenSeq = bytesToZeroWidth(payloadBytes);
  if (coverText.length === 0) return hiddenSeq;

  const pos = Math.min(Math.max(0, insertPosition), coverText.length);
  return coverText.slice(0, pos) + hiddenSeq + coverText.slice(pos);
}

export function extractZeroWidthText(text: string): Uint8Array {
  return zeroWidthToBytes(text);
}

export function bytesToVariationSelectors(bytes: Uint8Array): string {
  let result = '';
  for (let i = 0; i < bytes.length; i++) {
    const high = (bytes[i] >> 4) & 0x0f;
    const low = bytes[i] & 0x0f;
    result += String.fromCodePoint(0xFE00 + high) + String.fromCodePoint(0xFE00 + low);
  }
  return result;
}

export function variationSelectorsToBytes(text: string): Uint8Array {
  const nybbles: number[] = [];
  const chars = Array.from(text);
  for (const char of chars) {
    const code = char.codePointAt(0);
    if (code && code >= 0xFE00 && code <= 0xFE0F) {
      nybbles.push(code - 0xFE00);
    }
  }

  const bytes = new Uint8Array(Math.floor(nybbles.length / 2));
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = (nybbles[i * 2] << 4) | nybbles[i * 2 + 1];
  }
  return bytes;
}

/**
 * Universal Smart Text Steganography Extractor
 * Tests all text steganography engines and automatically detects the valid HBX1 protocol packet!
 */
export function smartExtractTextBytes(text: string): Uint8Array {
  const extractors = [
    extractChineseHomoglyph,
    kaomojiSequenceToBytes,
    emojiSequenceToBytes,
    cyberSequenceToBytes,
    extractHomoglyph,
    extractZeroWidthText,
    variationSelectorsToBytes,
    extractPunctuationStego,
    whitespaceToBytes
  ];

  // Pass 1: Look for exact HBX1 magic header (0x48, 0x42, 0x58, 0x31)
  for (const fn of extractors) {
    try {
      const bytes = fn(text);
      if (bytes && bytes.length >= 15) {
        if (bytes[0] === 0x48 && bytes[1] === 0x42 && bytes[2] === 0x58 && bytes[3] === 0x31) {
          return bytes;
        }
      }
    } catch {}
  }

  // Pass 2: Fallback to non-empty byte stream
  for (const fn of extractors) {
    try {
      const bytes = fn(text);
      if (bytes && bytes.length > 0) return bytes;
    } catch {}
  }

  return new Uint8Array(0);
}

export function bytesToWhitespace(bytes: Uint8Array): string {
  let result = '';
  for (let i = 0; i < bytes.length; i++) {
    const byte = bytes[i];
    for (let bit = 7; bit >= 0; bit--) {
      const b = (byte >> bit) & 1;
      result += b === 1 ? '\u00A0' : ' ';
    }
  }
  return result;
}

export function whitespaceToBytes(text: string): Uint8Array {
  let bits = '';
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '\u00A0') {
      bits += '1';
    } else if (char === ' ') {
      bits += '0';
    }
  }

  const bytes = new Uint8Array(Math.floor(bits.length / 8));
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(bits.substring(i * 8, (i + 1) * 8), 2);
  }
  return bytes;
}

/**
 * Token Inspector
 */
export function analyzeInvisibleCharacters(text: string): InvisibleCharToken[] {
  const tokens: InvisibleCharToken[] = [];
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const codePointNum = text.codePointAt(i) || 0;
    const codePointHex = `U+${codePointNum.toString(16).toUpperCase().padStart(4, '0')}`;

    if (char === ZW_CHARS.ZWS) {
      tokens.push({ index: i, char, codePoint: codePointHex, name: 'Zero Width Space (零宽空格)', type: 'zero-width' });
    } else if (char === ZW_CHARS.ZWNJ) {
      tokens.push({ index: i, char, codePoint: codePointHex, name: 'Zero Width Non-Joiner (零宽不连字符)', type: 'zero-width' });
    } else if (char === ZW_CHARS.ZWJ) {
      tokens.push({ index: i, char, codePoint: codePointHex, name: 'Zero Width Joiner (零宽连字符)', type: 'zero-width' });
    } else if (char === ZW_CHARS.WJ) {
      tokens.push({ index: i, char, codePoint: codePointHex, name: 'Word Joiner (词连字符)', type: 'zero-width' });
    } else if (codePointNum >= 0xFE00 && codePointNum <= 0xFE0F) {
      tokens.push({ index: i, char, codePoint: codePointHex, name: `Variation Selector ${codePointNum - 0xFE00 + 1}`, type: 'variation-selector' });
    } else if (CN_DECODE_MAP[char] === '1' || HOMOGLYPH_DECODE_MAP[char] === '1') {
      tokens.push({ index: i, char, codePoint: codePointHex, name: 'Homoglypt Substitution (同形异码字)', type: 'homoglyph' });
    } else if (char === '\u00A0') {
      tokens.push({ index: i, char: '[NBSP]', codePoint: codePointHex, name: 'Non-Breaking Space (不换行空格)', type: 'special-space' });
    } else {
      tokens.push({ index: i, char, codePoint: codePointHex, name: 'Normal Character', type: 'normal' });
    }
  }

  return tokens;
}

export function generateAcrosticPoem(secretChars: string): string[] {
  const lineTemplates: Record<string, string[]> = {
    '今': ['今夕何夕秋风起', '今日天气格外晴', '今天项目进展顺'],
    '晚': ['晚霞映红半边天', '晚风拂过杨柳岸', '晚上集中开会议'],
    '八': ['八方宾客齐聚首', '八月桂花满枝头', '八点准时在二楼'],
    '点': ['点点星光照前路', '点滴积累见成效', '点名确认各组员'],
    '开': ['开怀畅饮论英雄', '开诚布公谋发展', '开源节流创佳绩'],
    '会': ['会心一笑胜千言', '风云际会展宏图', '会后汇总进度表']
  };

  const chars = Array.from(secretChars);
  return chars.map(c => {
    const list = lineTemplates[c];
    if (list) {
      return list[Math.floor(Math.random() * list.length)];
    }
    return `${c}字横空留胜迹，春风吹拂绿江岸。`;
  });
}
