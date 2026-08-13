import React, { useState } from 'react';
import { FileArchive, Upload, Download, Lock, Unlock, AlertCircle, FileText, Check } from 'lucide-react';
import { packPayload, unpackPayload, PayloadType } from '../../core/protocol';
import { embedImageContainer, extractImageContainer } from '../../core/imageStego';

export const FileEncapsulationTab: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'pack' | 'unpack'>('pack');

  // Pack state
  const [carrierFile, setCarrierFile] = useState<File | null>(null);
  const [payloadFile, setPayloadFile] = useState<File | null>(null);
  const [password, setPassword] = useState('');
  const [packedResultUrl, setPackedResultUrl] = useState<string | null>(null);
  const [packedFileName, setPackedFileName] = useState('');

  // Unpack state
  const [inputFile, setInputFile] = useState<File | null>(null);
  const [unpackPassword, setUnpackPassword] = useState('');
  const [unpackedResult, setUnpackedResult] = useState<{ name: string; url: string; text?: string } | null>(null);

  const [errorMsg, setErrorMsg] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePack = async () => {
    setErrorMsg('');
    setPackedResultUrl(null);

    if (!carrierFile || !payloadFile) {
      setErrorMsg('请选择主载体文件与被隐藏的数据文件');
      return;
    }

    setIsProcessing(true);
    try {
      const payloadBuf = new Uint8Array(await payloadFile.arrayBuffer());
      const carrierBuf = new Uint8Array(await carrierFile.arrayBuffer());

      // Pack payload using HBX protocol
      const packedPayload = await packPayload(payloadBuf, PayloadType.FILE, password, payloadFile.name);

      // Embed into carrier end
      const containerBytes = embedImageContainer(carrierBuf, packedPayload);

      const blob = new Blob([new Uint8Array(containerBytes)], { type: carrierFile.type || 'application/octet-stream' });
      setPackedResultUrl(URL.createObjectURL(blob));
      setPackedFileName(`encapsulated_${carrierFile.name}`);
    } catch (e: any) {
      setErrorMsg(`封装失败: ${e.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUnpack = async () => {
    setErrorMsg('');
    setUnpackedResult(null);

    if (!inputFile) {
      setErrorMsg('请选择要解析的隐藏容器文件');
      return;
    }

    setIsProcessing(true);
    try {
      const fileBuf = new Uint8Array(await inputFile.arrayBuffer());
      const extractedBytes = extractImageContainer(fileBuf);

      const unpacked = await unpackPayload(extractedBytes, unpackPassword);
      if (unpacked.payloadFile) {
        const blob = new Blob([new Uint8Array(unpacked.payloadFile.data)], { type: unpacked.payloadFile.type });
        setUnpackedResult({
          name: unpacked.payloadFile.name,
          url: URL.createObjectURL(blob),
          text: unpacked.payloadText
        });
      } else if (unpacked.payloadText) {
        setUnpackedResult({
          name: 'extracted_payload.txt',
          url: URL.createObjectURL(new Blob([unpacked.payloadText], { type: 'text/plain' })),
          text: unpacked.payloadText
        });
      }
    } catch (e: any) {
      setErrorMsg(`解封装提取失败: ${e.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn">
      {/* Sub tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveSubTab('pack')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center space-x-2 transition-all ${
            activeSubTab === 'pack'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Lock className="w-3.5 h-3.5" />
          <span>文件封装容器 (Pack)</span>
        </button>
        <button
          onClick={() => setActiveSubTab('unpack')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center space-x-2 transition-all ${
            activeSubTab === 'unpack'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Unlock className="w-3.5 h-3.5" />
          <span>文件提取拆包 (Unpack)</span>
        </button>
      </div>

      {errorMsg && (
        <div className="p-3 bg-rose-950/80 border border-rose-800/80 rounded-xl text-xs text-rose-200 flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Pack Mode */}
      {activeSubTab === 'pack' && (
        <div className="bg-slate-900/80 rounded-xl border border-slate-800 p-6 space-y-5">
          <h3 className="text-sm font-semibold text-white flex items-center space-x-2">
            <FileArchive className="w-4 h-4 text-blue-400" />
            <span>将秘密文件藏入主载体文件中</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1.5">1. 选择表面载体文件 (Photo/Pdf/Doc):</label>
              <input
                type="file"
                onChange={(e) => setCarrierFile(e.target.files?.[0] || null)}
                className="w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:bg-slate-800 file:text-slate-200 cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1.5">2. 选择隐藏秘密文件 (Payload):</label>
              <input
                type="file"
                onChange={(e) => setPayloadFile(e.target.files?.[0] || null)}
                className="w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:bg-slate-800 file:text-slate-200 cursor-pointer"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1.5">AES-256-GCM 加密口令 (可选):</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
              placeholder="建议加密锁住秘密文件..."
            />
          </div>

          <button
            onClick={handlePack}
            disabled={isProcessing}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-lg shadow-blue-600/30 transition-all"
          >
            {isProcessing ? '正在打包封装中...' : '生成封装容器文件'}
          </button>

          {packedResultUrl && (
            <div className="p-4 bg-slate-950 rounded-xl border border-blue-900/60 flex items-center justify-between animate-fadeIn">
              <div>
                <p className="text-xs font-mono text-blue-300 font-semibold">{packedFileName}</p>
                <p className="text-[11px] text-slate-400">已将隐藏文件注入容器中。</p>
              </div>
              <a
                href={packedResultUrl}
                download={packedFileName}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-lg shadow-emerald-600/30"
              >
                <Download className="w-3.5 h-3.5" />
                <span>下载容器文件</span>
              </a>
            </div>
          )}
        </div>
      )}

      {/* Unpack Mode */}
      {activeSubTab === 'unpack' && (
        <div className="bg-slate-900/80 rounded-xl border border-slate-800 p-6 space-y-5">
          <h3 className="text-sm font-semibold text-white flex items-center space-x-2">
            <Unlock className="w-4 h-4 text-emerald-400" />
            <span>解拆容器提取内部隐藏文件</span>
          </h3>

          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1.5">选择容器文件:</label>
            <input
              type="file"
              onChange={(e) => setInputFile(e.target.files?.[0] || null)}
              className="w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:bg-slate-800 file:text-slate-200 cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1.5">解密密码 (若有):</label>
            <input
              type="password"
              value={unpackPassword}
              onChange={(e) => setUnpackPassword(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
              placeholder="未加密可留空..."
            />
          </div>

          <button
            onClick={handleUnpack}
            disabled={isProcessing}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-lg shadow-emerald-600/30 transition-all"
          >
            {isProcessing ? '正在解包分析中...' : '提取还原底层数据文件'}
          </button>

          {unpackedResult && (
            <div className="p-4 bg-slate-950 rounded-xl border border-emerald-900/60 space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-emerald-400">成功解拆数据: {unpackedResult.name}</span>
                <a
                  href={unpackedResult.url}
                  download={unpackedResult.name}
                  className="px-3 py-1.5 bg-emerald-600 text-white rounded text-xs font-semibold hover:bg-emerald-500"
                >
                  下载导出的文件
                </a>
              </div>
              {unpackedResult.text && (
                <div className="p-3 bg-slate-900 rounded font-mono text-xs text-slate-300 whitespace-pre-wrap select-all">
                  {unpackedResult.text}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
