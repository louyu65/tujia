/**
 * Web & Markdown Steganography Engine
 */

import { bytesToZeroWidth, zeroWidthToBytes } from './textStego';

export enum WebStegoType {
  HTML_COMMENT = 'html-comment',
  HTML_ATTRIBUTE = 'html-attribute',
  MARKDOWN_ZERO_WIDTH = 'markdown-zero-width'
}

/**
 * Embed bytes into HTML/Markdown document
 */
export function embedWebPayload(
  coverContent: string,
  payloadBytes: Uint8Array,
  type: WebStegoType
): string {
  const b64 = btoa(String.fromCharCode(...payloadBytes));

  if (type === WebStegoType.HTML_COMMENT) {
    const commentTag = `\n<!-- HBX:${b64} -->\n`;
    return coverContent + commentTag;
  } else if (type === WebStegoType.HTML_ATTRIBUTE) {
    // Inject data-hbx attribute into first div or body tag
    if (coverContent.includes('<body')) {
      return coverContent.replace('<body', `<body data-hbx="${b64}"`);
    } else if (coverContent.includes('<div')) {
      return coverContent.replace('<div', `<div data-hbx="${b64}"`);
    }
    return `<div data-hbx="${b64}">\n${coverContent}\n</div>`;
  } else if (type === WebStegoType.MARKDOWN_ZERO_WIDTH) {
    const zwSeq = bytesToZeroWidth(payloadBytes);
    return `# 文档\n\n${coverContent}${zwSeq}\n`;
  }

  return coverContent;
}

/**
 * Extract bytes from HTML/Markdown document
 */
export function extractWebPayload(webContent: string): Uint8Array {
  // 1. Try HTML Comment match: <!-- HBX:(.*?) -->
  const commentMatch = webContent.match(/<!--\s*HBX:(.*?)\s*-->/);
  if (commentMatch && commentMatch[1]) {
    const b64 = commentMatch[1].trim();
    const str = atob(b64);
    const bytes = new Uint8Array(str.length);
    for (let i = 0; i < str.length; i++) bytes[i] = str.charCodeAt(i);
    return bytes;
  }

  // 2. Try HTML data-hbx attribute: data-hbx="(.*?)"
  const attrMatch = webContent.match(/data-hbx=["'](.*?)["']/);
  if (attrMatch && attrMatch[1]) {
    const b64 = attrMatch[1].trim();
    const str = atob(b64);
    const bytes = new Uint8Array(str.length);
    for (let i = 0; i < str.length; i++) bytes[i] = str.charCodeAt(i);
    return bytes;
  }

  // 3. Try Zero-Width extract
  const zwBytes = zeroWidthToBytes(webContent);
  if (zwBytes.length > 0) {
    return zwBytes;
  }

  throw new Error('未在 Web / Markdown 文本中检测到 HTML/Markdown 隐秘载荷');
}
