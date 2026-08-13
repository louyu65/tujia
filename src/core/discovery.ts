/**
 * Discovery Protocol Engine (HiddenBox Discovery Core)
 * 
 * Manages how users and automated systems discover hidden payloads:
 * 1. EXPLICIT: Visible tags like [HBX1]
 * 2. EASTER_EGG: Kaomoji / Emoji / Symbol cues
 * 3. BLIND_DETECT: Deep forensic scan
 * 4. CLIPBOARD_AUTO: Automatic listener for clipboard text
 */

export enum DiscoveryType {
  EXPLICIT = 'explicit',        // 显式标识：[HBX1] 或 HBX Tag
  EASTER_EGG = 'easter_egg',    // 视觉彩蛋：特定颜文字 (⁠╹⁠◡⁠╹⁠) 或 Emoji 💬
  BLIND_DETECT = 'blind_detect',// 盲测扫描：无痕取证
  CLIPBOARD = 'clipboard'       // 剪贴板自动感知
}

export interface DiscoverySignal {
  type: DiscoveryType;
  confidence: number; // 0 - 100
  cue: string;
  description: string;
}

/**
 * Scan text to analyze discovery cues
 */
export function analyzeDiscoveryCues(text: string): DiscoverySignal[] {
  const signals: DiscoverySignal[] = [];

  // 1. Check Explicit Identifier
  if (text.includes('[HBX') || text.includes('HBX1') || text.includes('HiddenBox')) {
    signals.push({
      type: DiscoveryType.EXPLICIT,
      confidence: 100,
      cue: '[HBX1] 显式协议标签',
      description: '检测到公开声明的 HiddenBox 协议标识符。'
    });
  }

  // 2. Check Visual Easter Egg Cues
  if (text.includes('(⁠╹⁠◡⁠╹⁠)') || text.includes('(⁠๑⁠•⁠̀⁠ㅂ⁠•⁠́⁠)⁠و') || text.includes('💬😀')) {
    signals.push({
      type: DiscoveryType.EASTER_EGG,
      confidence: 90,
      cue: '颜文字 / Emoji 暗号线索',
      description: '检测到 HiddenBox 专用彩蛋表情暗号。'
    });
  }

  // 3. Check Special Chinese Homoglyph Markers
  if (text.includes('【隐】')) {
    signals.push({
      type: DiscoveryType.EXPLICIT,
      confidence: 95,
      cue: '【隐】同形扩容分割符',
      description: '检测到中文同形字扩容隔离标记。'
    });
  }

  return signals;
}
