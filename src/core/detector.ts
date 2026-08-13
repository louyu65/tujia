/**
 * Smart Detection & Analysis Center (HiddenBox Detection Engine)
 */

import { unpackPayload, UnpackResult } from './protocol';
import { analyzeInvisibleCharacters, zeroWidthToBytes, variationSelectorsToBytes } from './textStego';
import { extractImageContainer, extractLSBPayload } from './imageStego';
import { extractWebPayload } from './webStego';

export enum DetectionType {
  TEXT = 'text',
  IMAGE = 'image',
  FILE = 'file'
}

export enum ThreatLevel {
  SAFE = '安全（未发现隐写）',
  SUSPICIOUS = '疑似（发现不可见字符/异常元数据）',
  CONFIRMED = '确诊（成功解密 HiddenBox 隐藏数据）'
}

export interface DetectionFinding {
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'danger';
}

export interface DetectionReport {
  type: DetectionType;
  threatLevel: ThreatLevel;
  riskScore: number; // 0 - 100
  findings: DetectionFinding[];
  invisibleCharCount: number;
  totalLength: number;
  extractedPacket?: UnpackResult;
  extractedRawBytes?: Uint8Array;
}

/**
 * Detect text content for steganographic payloads
 */
export async function detectTextStego(text: string, password?: string): Promise<DetectionReport> {
  const tokens = analyzeInvisibleCharacters(text);
  const invisibleTokens = tokens.filter(t => t.type !== 'normal');
  const invisibleCount = invisibleTokens.length;
  
  const findings: DetectionFinding[] = [];
  let riskScore = 0;
  let threatLevel = ThreatLevel.SAFE;
  let extractedPacket: UnpackResult | undefined = undefined;
  let extractedRawBytes: Uint8Array | undefined = undefined;

  if (invisibleCount > 0) {
    riskScore += Math.min(80, invisibleCount * 10);
    findings.push({
      title: '高密度不可见字符 detected',
      description: `文本中检测到 ${invisibleCount} 个不可见字符 (包含零宽空格、零宽连字符或变体选择符)。`,
      severity: 'warning'
    });

    // Try extracting zero-width bytes
    const zwBytes = zeroWidthToBytes(text);
    if (zwBytes.length >= 15) {
      try {
        extractedPacket = await unpackPayload(zwBytes, password);
        threatLevel = ThreatLevel.CONFIRMED;
        riskScore = 100;
        findings.push({
          title: '已解密 HiddenBox 协议数据包',
          description: `成功从零宽字符中匹配 HBX1 协议，载荷类型: ${extractedPacket.header.payloadType}, 载荷解密长度: ${extractedPacket.header.payloadLength} 字节。`,
          severity: 'danger'
        });
      } catch (e: any) {
        extractedRawBytes = zwBytes;
        threatLevel = ThreatLevel.SUSPICIOUS;
        findings.push({
          title: '零宽隐写载荷存在（密码未提供或非标准协议）',
          description: `已提取出 ${zwBytes.length} 字节二进制隐藏数据: ${e.message}`,
          severity: 'warning'
        });
      }
    } else {
      // Try variation selectors
      const vsBytes = variationSelectorsToBytes(text);
      if (vsBytes.length >= 15) {
        try {
          extractedPacket = await unpackPayload(vsBytes, password);
          threatLevel = ThreatLevel.CONFIRMED;
          riskScore = 100;
        } catch {
          extractedRawBytes = vsBytes;
          threatLevel = ThreatLevel.SUSPICIOUS;
        }
      }
    }
  }

  // Check Web/HTML comment
  if (text.includes('<!-- HBX:') || text.includes('data-hbx=')) {
    riskScore = Math.max(riskScore, 90);
    findings.push({
      title: 'HTML/Markdown 隐写注释已标记',
      description: '检测到 HTML 注释或 data-hbx 属性，包含 HiddenBox 载荷。',
      severity: 'danger'
    });
    try {
      const webBytes = extractWebPayload(text);
      extractedPacket = await unpackPayload(webBytes, password);
      threatLevel = ThreatLevel.CONFIRMED;
      riskScore = 100;
    } catch (e: any) {
      threatLevel = ThreatLevel.SUSPICIOUS;
    }
  }

  if (findings.length === 0) {
    findings.push({
      title: '文本清洁度良好',
      description: '未发现任何不可见 Unicode 符号、零宽隐写或 HTML 属性隐藏层。',
      severity: 'info'
    });
  }

  return {
    type: DetectionType.TEXT,
    threatLevel,
    riskScore,
    findings,
    invisibleCharCount: invisibleCount,
    totalLength: text.length,
    extractedPacket,
    extractedRawBytes
  };
}

/**
 * Detect File / Image for Polyglot Container or LSB payload
 */
export async function detectFileStego(
  fileBytes: Uint8Array,
  imageData?: ImageData,
  password?: string
): Promise<DetectionReport> {
  const findings: DetectionFinding[] = [];
  let riskScore = 0;
  let threatLevel = ThreatLevel.SAFE;
  let extractedPacket: UnpackResult | undefined = undefined;
  let extractedRawBytes: Uint8Array | undefined = undefined;

  // 1. Check Image Polyglot Container (HBXC)
  try {
    const containerBytes = extractImageContainer(fileBytes);
    riskScore = 100;
    threatLevel = ThreatLevel.CONFIRMED;
    findings.push({
      title: '图像尾部包含 Polyglot 隐藏文件容器',
      description: `在文件尾部检测到 HBXC 容器标记，提取出 ${containerBytes.length} 字节追加数据。`,
      severity: 'danger'
    });

    try {
      extractedPacket = await unpackPayload(containerBytes, password);
    } catch {
      extractedRawBytes = containerBytes;
    }
  } catch {
    // No polyglot container
  }

  // 2. Check Image LSB if Canvas ImageData is available
  if (imageData && threatLevel !== ThreatLevel.CONFIRMED) {
    try {
      const lsbBytes = extractLSBPayload(imageData, 1);
      if (lsbBytes.length >= 15) {
        riskScore = 95;
        findings.push({
          title: '图像 LSB 最低有效位存在隐藏载荷',
          description: `从像素点中提取出 ${lsbBytes.length} 字节隐写位流。`,
          severity: 'warning'
        });

        try {
          extractedPacket = await unpackPayload(lsbBytes, password);
          threatLevel = ThreatLevel.CONFIRMED;
          riskScore = 100;
        } catch {
          extractedRawBytes = lsbBytes;
          threatLevel = ThreatLevel.SUSPICIOUS;
        }
      }
    } catch {
      // LSB not found
    }
  }

  if (findings.length === 0) {
    findings.push({
      title: '文件防护扫描安全',
      description: '未在文件尾部及像素结构中发现追加载荷或 LSB 异常。',
      severity: 'info'
    });
  }

  return {
    type: DetectionType.FILE,
    threatLevel,
    riskScore,
    findings,
    invisibleCharCount: 0,
    totalLength: fileBytes.length,
    extractedPacket,
    extractedRawBytes
  };
}
