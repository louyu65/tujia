import React, { useState } from 'react';
import { QrCode, Download, Lock, Unlock, AlertCircle, Copy, Check } from 'lucide-react';
import { generateDualQRCode, extractQRStegoPayload } from '../../core/qrStego';
import { packPayload, unpackPayload, PayloadType } from '../../core/protocol';

export const DualQRTab: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'generate' | 'parse'>('generate');

  // Generate
  const [publicUrl, setPublicUrl] = useState('https://example.com/welcome');
  const [hiddenPayload, setHiddenPayload] = useState('口令暗号：VIP-COMMAND-999');
  const [password, setPassword] = useState('');
  const [qrResultUrl, setQrResultUrl] = useState<string | null>(null);

  // Parse
  const [scannedQrText, setScannedQrText] = useState('');
  const [parsePassword, setParsePassword] = useState('');
  const [parsedSecret, setParsedSecret] = useState('');

  const [errorMsg, setErrorMsg] = useState('');

  const handleGenerate = async () => {
    setErrorMsg('');
    try {
      const packet = await packPayload(hiddenPayload, PayloadType.TEXT, password);
      const res = await generateDualQRCode(publicUrl, packet);
      setQrResultUrl(res.qrDataUrl);
    } catch (e: any) {
      setErrorMsg(`双重二维码生成失败: ${e.message}`);
    }
  };

  const handleParse = async () => {
    setErrorMsg('');
    setParsedSecret('');
    try {
      const payloadBytes = extractQRStegoPayload(scannedQrText);
      const unpacked = await unpackPayload(payloadBytes, parsePassword);
      setParsedSecret(unpacked.payloadText || '成功提取隐藏数据');
    } catch (e: any) {
      setErrorMsg(`二维码隐写提取失败: ${e.message}`);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveSubTab('generate')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center space-x-2 transition-all ${
            activeSubTab === 'generate'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Lock className="w-3.5 h-3.5" />
          <span>生成双重隐形二维码 (Generate)</span>
        </button>
        <button
          onClick={() => setActiveSubTab('parse')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center space-x-2 transition-all ${
            activeSubTab === 'parse'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Unlock className="w-3.5 h-3.5" />
          <span>深度提取二维码隐藏层 (Parse)</span>
        </button>
      </div>

      {errorMsg && (
        <div className="p-3 bg-rose-950/80 border border-rose-800/80 rounded-xl text-xs text-rose-200 flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {activeSubTab === 'generate' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-900/80 rounded-xl border border-slate-800 p-5 space-y-4">
            <h3 className="text-sm font-semibold text-white flex items-center space-x-2">
              <QrCode className="w-4 h-4 text-blue-400" />
              <span>设置公开二维码内容与绝密隐藏层</span>
            </h3>

            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1.5">手机相机直接扫码看到的公开文本/URL:</label>
              <input
                type="text"
                value={publicUrl}
                onChange={(e) => setPublicUrl(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono"
                placeholder="如 https://example.com/welcome"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1.5">只在 HiddenBox 中解析出的秘密 payload:</label>
              <textarea
                value={hiddenPayload}
                onChange={(e) => setHiddenPayload(e.target.value)}
                rows={3}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 font-mono leading-relaxed"
                placeholder="在二维码内部零宽嵌入的隐藏数据..."
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1.5">隐藏层 AES 口令密码 (可选):</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-200"
                placeholder="解密需要的密码..."
              />
            </div>

            <button
              onClick={handleGenerate}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-lg shadow-blue-600/30 transition-all"
            >
              生成双重隐形二维码
            </button>
          </div>

          <div className="bg-slate-900/80 rounded-xl border border-slate-800 p-5 flex flex-col items-center justify-center space-y-4">
            <h3 className="text-sm font-semibold text-white">二维码实时预览</h3>
            {qrResultUrl ? (
              <div className="space-y-4 text-center">
                <div className="p-4 bg-white rounded-2xl shadow-xl border border-slate-700 inline-block">
                  <img src={qrResultUrl} alt="Dual QR Code" className="w-56 h-56 object-contain" />
                </div>
                <div className="space-y-2">
                  <a
                    href={qrResultUrl}
                    download="dual_hiddenbox_qrcode.png"
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-lg shadow-emerald-600/30 inline-flex items-center space-x-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>下载高清双重二维码</span>
                  </a>
                </div>
              </div>
            ) : (
              <div className="w-56 h-56 border border-slate-800/80 rounded-2xl bg-slate-950 flex items-center justify-center text-slate-600 text-xs italic">
                点击左侧生成预览...
              </div>
            )}
          </div>
        </div>
      )}

      {activeSubTab === 'parse' && (
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="bg-slate-900/80 rounded-xl border border-slate-800 p-6 space-y-4">
            <h3 className="text-sm font-semibold text-white flex items-center space-x-2">
              <Unlock className="w-4 h-4 text-emerald-400" />
              <span>提取解析二维码背后的隐秘 Payload</span>
            </h3>

            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1.5">粘贴扫码获得的完整字符串:</label>
              <textarea
                value={scannedQrText}
                onChange={(e) => setScannedQrText(e.target.value)}
                rows={4}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 font-mono leading-relaxed"
                placeholder="粘贴包含零宽隐藏字符的扫码文本或 URL..."
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1.5">解密密码 (若有):</label>
              <input
                type="password"
                value={parsePassword}
                onChange={(e) => setParsePassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-200"
              />
            </div>

            <button
              onClick={handleParse}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-lg shadow-emerald-600/30 transition-all"
            >
              深度解密隐藏 Payload
            </button>
          </div>

          {parsedSecret && (
            <div className="bg-slate-900/90 rounded-xl border border-emerald-800 p-6 space-y-3 glow-emerald">
              <span className="text-xs font-mono font-bold text-emerald-400">提取成功的绝密 Payload:</span>
              <div className="p-4 bg-slate-950 rounded-lg font-mono text-xs text-emerald-300 leading-relaxed whitespace-pre-wrap select-all">
                {parsedSecret}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
