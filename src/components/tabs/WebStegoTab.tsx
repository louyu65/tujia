import React, { useState } from 'react';
import { Globe, Code, Copy, Check, Lock, Unlock, AlertCircle } from 'lucide-react';
import { embedWebPayload, extractWebPayload, WebStegoType } from '../../core/webStego';
import { packPayload, unpackPayload, PayloadType } from '../../core/protocol';

export const WebStegoTab: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'encode' | 'decode'>('encode');
  const [webType, setWebType] = useState<WebStegoType>(WebStegoType.HTML_COMMENT);

  // Encode
  const [coverWeb, setCoverWeb] = useState('<div className="card">\n  <h1>欢迎来到 HiddenBox 官方站点</h1>\n  <p>这是一个正常的网页展示内容...</p>\n</div>');
  const [secretPayload, setSecretPayload] = useState('Agent-Config: { "role": "admin", "token": "secret-xyz-888" }');
  const [password, setPassword] = useState('');
  const [encodedOutput, setEncodedOutput] = useState('');
  const [copied, setCopied] = useState(false);

  // Decode
  const [inputWeb, setInputWeb] = useState('');
  const [decodePassword, setDecodePassword] = useState('');
  const [decodedOutput, setDecodedOutput] = useState('');

  const [errorMsg, setErrorMsg] = useState('');

  const handleEncode = async () => {
    setErrorMsg('');
    try {
      const packet = await packPayload(secretPayload, PayloadType.TEXT, password);
      const result = embedWebPayload(coverWeb, packet, webType);
      setEncodedOutput(result);
    } catch (e: any) {
      setErrorMsg(`Web 隐写生成失败: ${e.message}`);
    }
  };

  const handleDecode = async () => {
    setErrorMsg('');
    setDecodedOutput('');
    try {
      const extractedBytes = extractWebPayload(inputWeb);
      const unpacked = await unpackPayload(extractedBytes, decodePassword);
      setDecodedOutput(unpacked.payloadText || '成功解码 Web 隐写层');
    } catch (e: any) {
      setErrorMsg(`Web 隐写提取失败: ${e.message}`);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
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
            <span>生成 Web/MD 隐写</span>
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
            <span>解析 Web/MD 隐写</span>
          </button>
        </div>

        {activeSubTab === 'encode' && (
          <div className="flex items-center space-x-2 text-xs font-mono">
            <span className="text-slate-400">注入模式:</span>
            <select
              value={webType}
              onChange={(e) => setWebType(e.target.value as WebStegoType)}
              className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1 focus:outline-none focus:border-blue-500"
            >
              <option value={WebStegoType.HTML_COMMENT}>HTML 隐蔽注释 (&lt;!-- HBX --&gt;)</option>
              <option value={WebStegoType.HTML_ATTRIBUTE}>HTML data-hbx 属性</option>
              <option value={WebStegoType.MARKDOWN_ZERO_WIDTH}>Markdown 零宽隐写</option>
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

      {activeSubTab === 'encode' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-900/80 rounded-xl border border-slate-800 p-5 space-y-4">
            <h3 className="text-sm font-semibold text-white flex items-center space-x-2">
              <Globe className="w-4 h-4 text-blue-400" />
              <span>设置网页/文档与隐藏 payload</span>
            </h3>

            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1.5">HTML / Markdown 源码文本:</label>
              <textarea
                value={coverWeb}
                onChange={(e) => setCoverWeb(e.target.value)}
                rows={4}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-mono leading-relaxed"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1.5">隐藏底层 Agent / 签名数据:</label>
              <textarea
                value={secretPayload}
                onChange={(e) => setSecretPayload(e.target.value)}
                rows={3}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-mono leading-relaxed"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1.5">可选 AES-256 口令密码:</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono"
                placeholder="不加密留空..."
              />
            </div>

            <button
              onClick={handleEncode}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-lg shadow-blue-600/30 transition-all"
            >
              生成 Web/Markdown 隐写代码
            </button>
          </div>

          <div className="bg-slate-900/80 rounded-xl border border-slate-800 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">生成的源码 (含隐藏层)</h3>
              {encodedOutput && (
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(encodedOutput);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="flex items-center space-x-1 text-xs text-blue-400 font-mono"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? '已复制' : '复制代码'}</span>
                </button>
              )}
            </div>

            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 font-mono text-xs text-slate-200 leading-relaxed min-h-[220px] whitespace-pre-wrap break-all select-all">
              {encodedOutput || <span className="text-slate-600 italic">在左侧设置并生成代码...</span>}
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'decode' && (
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="bg-slate-900/80 rounded-xl border border-slate-800 p-6 space-y-4">
            <h3 className="text-sm font-semibold text-white flex items-center space-x-2">
              <Unlock className="w-4 h-4 text-emerald-400" />
              <span>提取 HTML / Markdown 中的隐藏层</span>
            </h3>

            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1.5">粘贴包含隐藏层的网页/文档源码:</label>
              <textarea
                value={inputWeb}
                onChange={(e) => setInputWeb(e.target.value)}
                rows={5}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 font-mono leading-relaxed"
                placeholder="粘贴包含 <!-- HBX:... --> 或 data-hbx 的 HTML/MD 代码..."
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1.5">密码 (若有):</label>
              <input
                type="password"
                value={decodePassword}
                onChange={(e) => setDecodePassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-200"
              />
            </div>

            <button
              onClick={handleDecode}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-lg shadow-emerald-600/30 transition-all"
            >
              解析隐藏 Payload
            </button>
          </div>

          {decodedOutput && (
            <div className="bg-slate-900/90 rounded-xl border border-emerald-800 p-6 space-y-3 glow-emerald">
              <span className="text-xs font-mono font-bold text-emerald-400">解密提取成功 Payload:</span>
              <div className="p-4 bg-slate-950 rounded-lg font-mono text-xs text-emerald-300 leading-relaxed whitespace-pre-wrap select-all">
                {decodedOutput}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
