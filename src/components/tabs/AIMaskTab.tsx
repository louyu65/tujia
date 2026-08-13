import React, { useState } from 'react';
import { Sparkles, Bot, Eye, RefreshCw, AlertCircle, Globe2, Lock, Unlock, Copy, Check, FileText, CheckCircle2 } from 'lucide-react';
import { packPayload, unpackPayload, PayloadType } from '../../core/protocol';
import {
  embedChineseHomoglyph,
  extractChineseHomoglyph,
  bytesToKaomojiSequence,
  kaomojiSequenceToBytes,
  bytesToEmojiSequence,
  emojiSequenceToBytes,
  embedZeroWidthText,
  extractZeroWidthText,
  smartExtractTextBytes,
  TextStegoMode
} from '../../core/textStego';

export const AIMaskTab: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'encode' | 'decode'>('encode');

  // API & Custom Endpoint Configuration
  const [provider, setProvider] = useState<'openai' | 'gemini' | 'simulation'>('openai');
  const [apiHost, setApiHost] = useState('https://api.openai.com/v1');
  const [apiKey, setApiKey] = useState('');
  const [modelName, setModelName] = useState('gpt-3.5-turbo');

  // Encode Form State: Article Topic & Requirements
  const [articleTopic, setArticleTopic] = useState('关于人工智能在未来医疗领域应用前景的深度思考');
  const [articleLength, setArticleLength] = useState<'short' | 'medium' | 'long'>('medium');
  const [secretPayload, setSecretPayload] = useState('绝密数据：项目编号 HBX-9982，预定于周五完成验收！');
  const [password, setPassword] = useState('');
  const [stegoAlgorithm, setStegoAlgorithm] = useState<TextStegoMode>(TextStegoMode.CN_HOMOGLYPH);

  const [generatedArticle, setGeneratedArticle] = useState('');
  const [copied, setCopied] = useState(false);

  // Decode Form State
  const [inputAIMaskText, setInputAIMaskText] = useState('');
  const [decodePassword, setDecodePassword] = useState('');
  const [decodedSecret, setDecodedSecret] = useState('');
  const [decodedMeta, setDecodedMeta] = useState<string | null>(null);

  const [isGenerating, setIsGenerating] = useState(false);
  const [isDecoding, setIsDecoding] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Preset Shortcuts for popular LLM endpoints
  const applyPreset = (preset: 'openai' | 'deepseek' | 'ollama' | 'gemini') => {
    if (preset === 'openai') {
      setProvider('openai');
      setApiHost('https://api.openai.com/v1');
      setModelName('gpt-3.5-turbo');
    } else if (preset === 'deepseek') {
      setProvider('openai');
      setApiHost('https://api.deepseek.com/v1');
      setModelName('deepseek-chat');
    } else if (preset === 'ollama') {
      setProvider('openai');
      setApiHost('http://localhost:11434/v1');
      setModelName('qwen2.5:7b');
    } else if (preset === 'gemini') {
      setProvider('gemini');
      setApiHost('https://generativelanguage.googleapis.com');
      setModelName('gemini-1.5-flash');
    }
  };

  // Generate a 100% Coherent, Fully Logical Article with LLM
  const generateCoherentArticleWithLLM = async (topic: string, len: string): Promise<string> => {
    const wordCount = len === 'short' ? '150字' : len === 'medium' ? '300字' : '500字';
    const systemPrompt = '你是一位专业的高级撰稿人与科普作家。你的任务是根据用户主题，撰写一篇逻辑严密、行文流畅、完全合情合理的专业长文章。只输出文章本体正文，严禁包含任何前缀、标题说明或总结性废话。';
    const userPrompt = `请围绕主题《${topic}》，撰写一篇长度约为 ${wordCount} 的完整文章。要求段落清晰，文采斐然，逻辑通顺。`;

    if (provider === 'openai') {
      const cleanHost = apiHost.trim().replace(/\/+$/, '');
      const endpoint = `${cleanHost}/chat/completions`;

      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };

      if (apiKey.trim()) {
        headers['Authorization'] = `Bearer ${apiKey.trim()}`;
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: modelName.trim() || 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.7
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(`OpenAI 兼容端点请求失败 (${res.status}): ${errData.error?.message || res.statusText}`);
      }

      const data = await res.json();
      return data.choices?.[0]?.message?.content?.trim() || '文章生成失败';
    } else if (provider === 'gemini') {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName.trim() || 'gemini-1.5-flash'}:generateContent?key=${apiKey.trim()}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }]
        })
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(`Gemini API 请求失败 (${res.status}): ${errData.error?.message || res.statusText}`);
      }
      const data = await res.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || 'Gemini 生成失败';
    }

    // Offline simulation fallback for coherent articles
    return `随着信息技术的飞速发展与多模态大模型的广泛应用，智能化医疗体系正在迎来前所未有的变革。从影像学的辅助诊断到个性化靶向药的精准研发，现代算法正在重新定义生命科学的边界。然而，在此过程中，数据安全与隐私保护依然是决定技术能否大规模落地的核心前提。我们需要在创新与合规之间建立起更加稳固的技术桥梁，确保科技真正服务于全人类的福祉。`;
  };

  // Execute Coherent Article Steganography Encoding
  const handleGenerateArticleStego = async () => {
    setErrorMsg('');
    if (!secretPayload.trim()) {
      setErrorMsg('请输入需要隐藏的绝密信息');
      return;
    }

    setIsGenerating(true);

    try {
      // Step 1: LLM generates a 100% logical, highly coherent article
      const rawArticle = await generateCoherentArticleWithLLM(articleTopic, articleLength);

      // Step 2: Pack secret payload into HBX protocol packet
      const isJson = secretPayload.trim().startsWith('{') || secretPayload.trim().startsWith('[');
      const packet = await packPayload(secretPayload, isJson ? PayloadType.JSON : PayloadType.TEXT, password);

      // Step 3: Embed packet into the coherent article without breaking readability
      let finalStegoArticle = '';
      if (stegoAlgorithm === TextStegoMode.CN_HOMOGLYPH) {
        // Low-density CJK homoglyph embedding (100% readable CJK text)
        finalStegoArticle = embedChineseHomoglyph(rawArticle, packet);
      } else if (stegoAlgorithm === TextStegoMode.KAOMOJI_CIPHER) {
        finalStegoArticle = rawArticle + '\n\n (⁠╹⁠◡⁠╹⁠) 随文附带暗号：' + bytesToKaomojiSequence(packet);
      } else if (stegoAlgorithm === TextStegoMode.EMOJI_CIPHER) {
        finalStegoArticle = rawArticle + '\n\n💬 ' + bytesToEmojiSequence(packet);
      } else {
        finalStegoArticle = embedZeroWidthText(rawArticle, packet, Math.floor(rawArticle.length / 2));
      }

      setGeneratedArticle(finalStegoArticle);
    } catch (e: any) {
      setErrorMsg(e.message || '生成失败');
    } finally {
      setIsGenerating(false);
    }
  };

  // Execute Decoding
  const handleDecodeArticle = async () => {
    setErrorMsg('');
    setDecodedSecret('');
    setDecodedMeta(null);

    if (!inputAIMaskText.trim()) {
      setErrorMsg('请输入需要解密的文章文本');
      return;
    }

    setIsDecoding(true);
    try {
      let bytes = smartExtractTextBytes(inputAIMaskText);

      if (bytes.length === 0) {
        throw new Error('未在文章中检测到有效隐藏字节流，请确认文本完整性或字符是否被平台滤除');
      }

      const unpacked = await unpackPayload(bytes, decodePassword);
      setDecodedSecret(unpacked.payloadText || JSON.stringify(unpacked.payloadJson, null, 2));
      setDecodedMeta(`协议: ${unpacked.header.magic} v${unpacked.header.version} | 加密: ${unpacked.header.isEncrypted ? 'AES-GCM (已解密)' : '未加密'} | 长度: ${unpacked.header.payloadLength} B`);
    } catch (e: any) {
      setErrorMsg(`解密失败: ${e.message}`);
    } finally {
      setIsDecoding(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="bg-slate-900/80 rounded-xl border border-slate-800 p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 via-pink-600 to-blue-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <span>AI 自然逻辑长文章隐写生成器</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-950 text-purple-300 border border-purple-800 font-bold">
                  100% COHERENT ARTICLE
                </span>
              </h2>
              <p className="text-xs text-slate-400">大模型生成**逻辑完全通顺、文采优美的高质量文章**，并将绝密数据无缝隐写嵌入其中。</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveSubTab('encode')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all ${
                activeSubTab === 'encode'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                  : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>逻辑长文隐写编码 (Encode)</span>
            </button>
            <button
              onClick={() => setActiveSubTab('decode')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all ${
                activeSubTab === 'decode'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                  : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
              }`}
            >
              <Unlock className="w-3.5 h-3.5" />
              <span>长文解密提取 (Decode)</span>
            </button>
          </div>
        </div>

        {/* LLM Endpoint Config */}
        <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3 font-mono text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
            <div className="flex items-center space-x-2 text-purple-300 font-semibold">
              <Globe2 className="w-4 h-4 text-purple-400" />
              <span>自定大模型 API 端点 (支持 OpenAI / DeepSeek / Ollama)</span>
            </div>
            <div className="flex items-center space-x-1.5 text-[11px]">
              <button onClick={() => applyPreset('deepseek')} className="px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800 hover:bg-blue-900">DeepSeek</button>
              <button onClick={() => applyPreset('openai')} className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 hover:bg-emerald-900">OpenAI</button>
              <button onClick={() => applyPreset('ollama')} className="px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800 hover:bg-purple-900">Local Ollama</button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-400 mb-1">Base URL:</label>
              <input
                type="text"
                value={apiHost}
                onChange={(e) => { setApiHost(e.target.value); setProvider('openai'); }}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 font-mono text-xs focus:outline-none focus:border-purple-500"
                placeholder="https://api.openai.com/v1"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">API Key:</label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 font-mono text-xs focus:outline-none focus:border-purple-500"
                placeholder="sk-xxxxxxxx"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Model Name:</label>
              <input
                type="text"
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 font-mono text-xs focus:outline-none focus:border-purple-500"
                placeholder="deepseek-chat / gpt-3.5-turbo"
              />
            </div>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 bg-amber-950/60 border border-amber-800/80 rounded-xl text-xs text-amber-200 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Encode Sub Tab */}
        {activeSubTab === 'encode' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2">
                <label className="block text-xs font-mono text-slate-400 mb-1.5">AI 生成文章的预设主题/命题:</label>
                <input
                  type="text"
                  value={articleTopic}
                  onChange={(e) => setArticleTopic(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 font-sans focus:outline-none focus:border-purple-500"
                  placeholder="输入任意文章主题，如：关于量子计算的科普..."
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1.5">生成文章篇幅长度:</label>
                <select
                  value={articleLength}
                  onChange={(e) => setArticleLength(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 font-semibold focus:outline-none focus:border-purple-500"
                >
                  <option value="short">短篇 (约 150 字)</option>
                  <option value="medium">中篇 (约 300 字 - 推荐)</option>
                  <option value="long">长篇 (约 500 字)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1.5">隐藏绝密 Payload (需要藏入文章的信息):</label>
                <textarea
                  value={secretPayload}
                  onChange={(e) => setSecretPayload(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1.5">隐写算法与加密口令:</label>
                <select
                  value={stegoAlgorithm}
                  onChange={(e) => setStegoAlgorithm(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 font-semibold mb-2 focus:outline-none focus:border-purple-500"
                >
                  <option value={TextStegoMode.CN_HOMOGLYPH}>🛡️ 中文同形字 (100% 行文流畅/自然免显框)</option>
                  <option value={TextStegoMode.KAOMOJI_CIPHER}> (⁠๑⁠•⁠̀⁠ㅂ⁠•⁠́⁠)⁠و✧ 颜文字暗号 (随文附带)</option>
                  <option value={TextStegoMode.EMOJI_CIPHER}>😀 Emoji 表情暗号</option>
                  <option value={TextStegoMode.ZERO_WIDTH}>⚠️ 经典零宽字符</option>
                </select>

                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono"
                  placeholder="AES 加密口令 (可选)..."
                />
              </div>
            </div>

            <button
              onClick={handleGenerateArticleStego}
              disabled={isGenerating}
              className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-lg text-xs font-semibold shadow-lg shadow-purple-600/30 transition-all flex items-center justify-center space-x-2"
            >
              {isGenerating ? <RefreshCw className="w-4 h-4 animate-spin text-purple-200" /> : <Sparkles className="w-4 h-4 text-purple-200" />}
              <span>{isGenerating ? '大模型创作高质量通顺文章 + 嵌入暗号中...' : '生成逻辑合理通顺的隐写长文章'}</span>
            </button>
          </div>
        )}

        {/* Decode Sub Tab */}
        {activeSubTab === 'decode' && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1.5">粘贴需要解密的长文章文本:</label>
              <textarea
                value={inputAIMaskText}
                onChange={(e) => setInputAIMaskText(e.target.value)}
                rows={5}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 font-sans leading-relaxed focus:outline-none focus:border-emerald-500"
                placeholder="粘贴收到的包含同形字或隐写暗号的长文章..."
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1.5">解密口令 (若设置了密码):</label>
              <input
                type="password"
                value={decodePassword}
                onChange={(e) => setDecodePassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-emerald-500"
                placeholder="未加密留空即可..."
              />
            </div>

            <button
              onClick={handleDecodeArticle}
              disabled={isDecoding}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center space-x-2"
            >
              {isDecoding ? <RefreshCw className="w-4 h-4 animate-spin text-white" /> : <Unlock className="w-4 h-4" />}
              <span>{isDecoding ? '正在提取文章中的隐藏数据...' : '提取与解密长文章中的隐藏暗号'}</span>
            </button>

            {decodedSecret && (
              <div className="p-4 bg-slate-950 rounded-xl border border-emerald-800 space-y-2 font-mono text-xs animate-fadeIn">
                <div className="flex justify-between items-center text-emerald-400 font-bold border-b border-slate-800 pb-2">
                  <span>从文章中解密提取成功 Payload</span>
                  {decodedMeta && <span className="text-[11px] text-slate-400 font-normal">{decodedMeta}</span>}
                </div>
                <div className="text-emerald-300 whitespace-pre-wrap select-all">{decodedSecret}</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Output Section for Generated Article */}
      {generatedArticle && activeSubTab === 'encode' && (
        <div className="bg-slate-900/90 rounded-xl border border-purple-900/60 p-6 space-y-4 animate-fadeIn shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-mono font-bold text-white">生成的逻辑通顺长文章 (已隐写嵌入暗号)</span>
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(generatedArticle);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="flex items-center space-x-1 text-xs text-purple-400 hover:text-purple-300 font-mono font-bold"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? '已复制整篇文章' : '一键复制完整长文'}</span>
            </button>
          </div>

          <div className="p-5 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-200 font-sans leading-relaxed whitespace-pre-wrap select-all break-all shadow-inner">
            {generatedArticle}
          </div>

          <div className="p-3 bg-purple-950/40 border border-purple-900/50 rounded-lg text-[11px] font-mono text-purple-300 flex items-center justify-between">
            <span>✨ 这是一篇完全合情合理、逻辑清晰的自然文章。你可以将其直接发布或发送，任何人阅读都会觉得这是一篇正常长文！</span>
          </div>
        </div>
      )}
    </div>
  );
};
