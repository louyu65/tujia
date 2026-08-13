import React, { useState } from 'react';
import { Layers, Lock, Unlock, Copy, Check, Sparkles, AlertCircle, Sparkle, ShieldCheck } from 'lucide-react';
import { packPayload, unpackPayload, PayloadType } from '../../core/protocol';
import {
  embedChineseHomoglyph,
  extractChineseHomoglyph,
  bytesToEmojiSequence,
  emojiSequenceToBytes,
  bytesToKaomojiSequence,
  kaomojiSequenceToBytes,
  bytesToCyberSequence,
  cyberSequenceToBytes,
  embedHomoglyph,
  extractHomoglyph,
  embedPunctuationStego,
  extractPunctuationStego,
  embedZeroWidthText,
  extractZeroWidthText,
  bytesToVariationSelectors,
  variationSelectorsToBytes,
  bytesToWhitespace,
  whitespaceToBytes,
  generateAcrosticPoem,
  smartExtractTextBytes,
  TextStegoMode
} from '../../core/textStego';
import { InvisibleSpotlight } from '../InvisibleSpotlight';

export const TextStegoTab: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'encode' | 'decode' | 'acrostic'>('encode');
  
  // Encode Form State
  const [coverText, setCoverText] = useState('今天项目发布顺利，大家辛苦啦！');
  const [secretText, setSecretText] = useState('机密数据：项目代号 A8271，今晚8点准时启动！');
  const [password, setPassword] = useState('');
  const [stegoMode, setStegoMode] = useState<TextStegoMode>(TextStegoMode.KAOMOJI_CIPHER);
  const [encodedResult, setEncodedResult] = useState('');
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Decode Form State
  const [inputHiddenText, setInputHiddenText] = useState('');
  const [decodePassword, setDecodePassword] = useState('');
  const [decodedSecret, setDecodedSecret] = useState('');
  const [decodedMeta, setDecodedMeta] = useState<string | null>(null);

  // Acrostic State
  const [acrosticInput, setAcrosticInput] = useState('今晚八点开会');
  const [acrosticResult, setAcrosticResult] = useState<string[]>([]);

  // Execute Encoding
  const handleEncode = async () => {
    setErrorMsg('');
    if (!secretText.trim()) {
      setErrorMsg('隐藏绝密信息不能为空');
      return;
    }

    setIsProcessing(true);
    try {
      // 1. Pack into HiddenBox Protocol Packet
      const packet = await packPayload(secretText, PayloadType.TEXT, password);

      // 2. Embed into cover text using chosen algorithm
      let result = '';
      if (stegoMode === TextStegoMode.KAOMOJI_CIPHER) {
        result = (coverText ? coverText + ' ' : '') + bytesToKaomojiSequence(packet);
      } else if (stegoMode === TextStegoMode.EMOJI_CIPHER) {
        result = (coverText ? coverText + '\n\n' : '') + bytesToEmojiSequence(packet);
      } else if (stegoMode === TextStegoMode.CYBER_SYMBOL) {
        result = (coverText ? coverText + ' ' : '') + bytesToCyberSequence(packet);
      } else if (stegoMode === TextStegoMode.CN_HOMOGLYPH) {
        result = embedChineseHomoglyph(coverText, packet);
      } else if (stegoMode === TextStegoMode.EN_HOMOGLYPH) {
        result = embedHomoglyph(coverText, packet);
      } else if (stegoMode === TextStegoMode.PUNCTUATION) {
        result = embedPunctuationStego(coverText, packet);
      } else if (stegoMode === TextStegoMode.ZERO_WIDTH) {
        result = embedZeroWidthText(coverText, packet, Math.floor(coverText.length / 2));
      } else if (stegoMode === TextStegoMode.VARIATION_SELECTOR) {
        const vsSeq = bytesToVariationSelectors(packet);
        result = coverText + vsSeq;
      } else if (stegoMode === TextStegoMode.WHITESPACE) {
        const wsSeq = bytesToWhitespace(packet);
        result = coverText + wsSeq;
      }

      setEncodedResult(result);
    } catch (e: any) {
      setErrorMsg(`隐写编码失败: ${e.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Execute Decoding
  const handleDecode = async () => {
    setErrorMsg('');
    setDecodedSecret('');
    setDecodedMeta(null);

    if (!inputHiddenText.trim()) {
      setErrorMsg('请输入包含隐藏信息的文本');
      return;
    }

    setIsProcessing(true);
    try {
      let bytes: Uint8Array;

      // Try selected mode first
      if (stegoMode === TextStegoMode.KAOMOJI_CIPHER) {
        bytes = kaomojiSequenceToBytes(inputHiddenText);
      } else if (stegoMode === TextStegoMode.EMOJI_CIPHER) {
        bytes = emojiSequenceToBytes(inputHiddenText);
      } else if (stegoMode === TextStegoMode.CYBER_SYMBOL) {
        bytes = cyberSequenceToBytes(inputHiddenText);
      } else if (stegoMode === TextStegoMode.CN_HOMOGLYPH) {
        bytes = extractChineseHomoglyph(inputHiddenText);
      } else if (stegoMode === TextStegoMode.EN_HOMOGLYPH) {
        bytes = extractHomoglyph(inputHiddenText);
      } else if (stegoMode === TextStegoMode.PUNCTUATION) {
        bytes = extractPunctuationStego(inputHiddenText);
      } else if (stegoMode === TextStegoMode.ZERO_WIDTH) {
        bytes = extractZeroWidthText(inputHiddenText);
      } else if (stegoMode === TextStegoMode.VARIATION_SELECTOR) {
        bytes = variationSelectorsToBytes(inputHiddenText);
      } else {
        bytes = whitespaceToBytes(inputHiddenText);
      }

      // If selected mode bytes don't start with HBX1 magic or is empty, run universal smart auto-extractor!
      if (bytes.length < 15 || bytes[0] !== 0x48 || bytes[1] !== 0x42 || bytes[2] !== 0x58 || bytes[3] !== 0x31) {
        const smartBytes = smartExtractTextBytes(inputHiddenText);
        if (smartBytes && smartBytes.length > 0) {
          bytes = smartBytes;
        }
      }

      if (bytes.length === 0) {
        throw new Error('未检测到隐藏的二进制码流，请确认隐藏文本完整性或字符是否被平台清除');
      }

      const unpacked = await unpackPayload(bytes, decodePassword);
      setDecodedSecret(unpacked.payloadText || '提取解密成功，但在解密文本中未获取到有效字符');
      setDecodedMeta(`协议: ${unpacked.header.magic} v${unpacked.header.version} | 加密: ${unpacked.header.isEncrypted ? 'AES-GCM (是)' : '否'} | 长度: ${unpacked.header.payloadLength} B`);
    } catch (e: any) {
      setErrorMsg(`解密失败: ${e.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGenerateAcrostic = () => {
    if (!acrosticInput.trim()) return;
    const res = generateAcrosticPoem(acrosticInput);
    setAcrosticResult(res);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Sub Tabs */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveSubTab('encode')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center space-x-2 transition-all ${
              activeSubTab === 'encode'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>信息隐写 (Encode)</span>
          </button>
          <button
            onClick={() => setActiveSubTab('decode')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center space-x-2 transition-all ${
              activeSubTab === 'decode'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Unlock className="w-3.5 h-3.5" />
            <span>还原解密 (Decode)</span>
          </button>
          <button
            onClick={() => setActiveSubTab('acrostic')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center space-x-2 transition-all ${
              activeSubTab === 'acrostic'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Sparkle className="w-3.5 h-3.5 text-yellow-400" />
            <span>藏头隐文算法助手</span>
          </button>
        </div>

        {/* Algorithm Selector with IM-Safe Badges */}
        {activeSubTab !== 'acrostic' && (
          <div className="flex items-center space-x-2 text-xs font-mono">
            <span className="text-slate-400 hidden sm:inline">算法模式:</span>
            <select
              value={stegoMode}
              onChange={(e) => setStegoMode(e.target.value as any)}
              className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1 focus:outline-none focus:border-blue-500 font-semibold"
            >
              <option value={TextStegoMode.KAOMOJI_CIPHER}> (⁠๑⁠•⁠̀⁠ㅂ⁠•⁠́⁠)⁠و✧ 颜文字暗号流 (超萌/社交完全无违和感)</option>
              <option value={TextStegoMode.EMOJI_CIPHER}>😀 Emoji 表情暗号 (微信原生/零豆腐框/高密度)</option>
              <option value={TextStegoMode.CYBER_SYMBOL}>🔥 爆款社交符号流 (🔥✨🎉🚀... 高赞感)</option>
              <option value={TextStegoMode.CN_HOMOGLYPH}>🛡️ 中文同形字 (全中文文案/微信钉钉免显框)</option>
              <option value={TextStegoMode.EN_HOMOGLYPH}>🛡️ 英文同形字 (英文文案免显框)</option>
              <option value={TextStegoMode.PUNCTUATION}>🛡️ 标点空格组合 (微信/钉钉免显框)</option>
              <option value={TextStegoMode.ZERO_WIDTH}>⚠️ 经典零宽字符 (IM平台可能会显框)</option>
              <option value={TextStegoMode.VARIATION_SELECTOR}>⚠️ 变体选择符 (U+FE00)</option>
            </select>
          </div>
        )}
      </div>

      {errorMsg && (
        <div className="p-3 bg-rose-950/80 border border-rose-800/80 rounded-xl text-xs text-rose-200 flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Encode Mode */}
      {activeSubTab === 'encode' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Input Section */}
          <div className="bg-slate-900/80 rounded-xl border border-slate-800 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white flex items-center space-x-2">
                <Layers className="w-4 h-4 text-blue-400" />
                <span>载体与隐藏层设置</span>
              </h3>
              {(stegoMode === TextStegoMode.KAOMOJI_CIPHER || stegoMode === TextStegoMode.EMOJI_CIPHER || stegoMode === TextStegoMode.CYBER_SYMBOL || stegoMode === TextStegoMode.CN_HOMOGLYPH) && (
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center space-x-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  <span>微信/钉钉零豆腐框保护中</span>
                </span>
              )}
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1.5">
                {stegoMode === TextStegoMode.CN_HOMOGLYPH ? '公开掩护文案 (支持任意中文或英文):' : '前端掩护文案 (可选，隐写暗号将自动贴在文案后):'}
              </label>
              <textarea
                value={coverText}
                onChange={(e) => setCoverText(e.target.value)}
                rows={3}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-sans leading-relaxed"
                placeholder="任意文案，如: 今天项目发布顺利，大家辛苦啦！..."
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1.5">隐藏绝密信息 (Secret Payload):</label>
              <textarea
                value={secretText}
                onChange={(e) => setSecretText(e.target.value)}
                rows={3}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-mono leading-relaxed"
                placeholder="需要悄悄藏在掩护文本中的秘密、口令、JSON数据..."
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1.5">AES-256-GCM 口令锁 (可选密码):</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
                placeholder="密码留空表示不附加 AES 加密..."
              />
            </div>

            <button
              onClick={handleEncode}
              disabled={isProcessing}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center space-x-2"
            >
              <Sparkles className="w-4 h-4 text-blue-200" />
              <span>{isProcessing ? '正在打包隐写中...' : '生成 HiddenBox 隐写文本'}</span>
            </button>
          </div>

          {/* Right Output & Spotlight */}
          <div className="space-y-4">
            <div className="bg-slate-900/80 rounded-xl border border-slate-800 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">生成的隐写文本 (无违和社交表达)</h3>
                {encodedResult && (
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(encodedResult);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="flex items-center space-x-1 text-xs text-blue-400 hover:text-blue-300 font-mono"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? '已复制' : '复制隐写文案'}</span>
                  </button>
                )}
              </div>

              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs text-slate-200 font-sans min-h-[100px] leading-relaxed break-all select-all">
                {encodedResult || <span className="text-slate-600 italic">在左侧设置参数并点击生成...</span>}
              </div>
            </div>

            {/* Live Invisible Spotlight */}
            <InvisibleSpotlight text={encodedResult || coverText} />
          </div>
        </div>
      )}

      {/* Decode Mode */}
      {activeSubTab === 'decode' && (
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="bg-slate-900/80 rounded-xl border border-slate-800 p-6 space-y-4">
            <h3 className="text-sm font-semibold text-white flex items-center space-x-2">
              <Unlock className="w-4 h-4 text-emerald-400" />
              <span>还原解密 HiddenBox 隐藏信息</span>
            </h3>

            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1.5">粘贴从微信/钉钉接收到的颜文字/Emoji/同形字文本:</label>
              <textarea
                value={inputHiddenText}
                onChange={(e) => setInputHiddenText(e.target.value)}
                rows={4}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-sans leading-relaxed"
                placeholder="粘贴包含颜文字、Emoji 暗号或中文同形字的文本..."
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1.5">解密密码 (如设置了 AES 加密):</label>
              <input
                type="password"
                value={decodePassword}
                onChange={(e) => setDecodePassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
                placeholder="未加密留空即可..."
              />
            </div>

            <button
              onClick={handleDecode}
              disabled={isProcessing}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-lg shadow-emerald-600/30 transition-all"
            >
              {isProcessing ? '正在解密提取中...' : '提取与解密隐藏数据'}
            </button>
          </div>

          {/* Decode Result Box */}
          {decodedSecret && (
            <div className="bg-slate-900/90 rounded-xl border border-emerald-800/60 p-6 space-y-3 animate-fadeIn glow-emerald">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-xs font-mono font-bold text-emerald-400">解密提取成功 Payload</span>
                {decodedMeta && <span className="text-[11px] font-mono text-slate-400">{decodedMeta}</span>}
              </div>
              <div className="p-4 bg-slate-950 rounded-lg font-mono text-xs text-emerald-300 leading-relaxed whitespace-pre-wrap select-all">
                {decodedSecret}
              </div>
            </div>
          )}

          {/* Spotlight for input inspection */}
          <InvisibleSpotlight text={inputHiddenText} />
        </div>
      )}

      {/* Acrostic Assistant Mode */}
      {activeSubTab === 'acrostic' && (
        <div className="max-w-3xl mx-auto bg-slate-900/80 rounded-xl border border-slate-800 p-6 space-y-5">
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-white flex items-center space-x-2">
              <Sparkle className="w-4 h-4 text-purple-400" />
              <span>藏头隐文辅助生成器 (Acrostic Generator)</span>
            </h3>
            <p className="text-xs text-slate-400">利用首字结构编码，将秘密字符作为每句句首隐藏到公开发布的文案或诗句中。</p>
          </div>

          <div className="flex items-center space-x-3">
            <input
              type="text"
              value={acrosticInput}
              onChange={(e) => setAcrosticInput(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500 font-mono"
              placeholder="输入需要嵌入的暗号首字，如：今晚八点开会..."
            />
            <button
              onClick={handleGenerateAcrostic}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold shadow-lg shadow-purple-600/30 transition-all"
            >
              生成藏头文案
            </button>
          </div>

          {acrosticResult.length > 0 && (
            <div className="p-4 bg-slate-950 rounded-xl border border-purple-900/50 space-y-2 font-mono text-sm">
              <div className="text-xs text-purple-400 font-sans font-medium mb-3">生成隐藏首字句子组：</div>
              {acrosticResult.map((line, i) => (
                <div key={i} className="flex items-center space-x-2">
                  <span className="w-6 h-6 rounded bg-purple-950 border border-purple-800 text-purple-300 flex items-center justify-center font-bold text-xs">
                    {line[0]}
                  </span>
                  <span className="text-slate-200">{line}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
