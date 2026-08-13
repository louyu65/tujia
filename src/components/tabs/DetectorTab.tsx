import React, { useState, useRef } from 'react';
import { Search, ShieldAlert, ShieldCheck, AlertTriangle, FileText, Image as ImageIcon, Unlock, Check, Sparkles } from 'lucide-react';
import { detectTextStego, detectFileStego, DetectionReport, ThreatLevel } from '../../core/detector';
import { DropZoneInput } from '../DropZoneInput';

export const DetectorTab: React.FC = () => {
  const [activeType, setActiveType] = useState<'text' | 'file'>('text');
  
  // Text scanner state
  const [scanText, setScanText] = useState('今天天气真好，今晚8点准时开会。​​​​​‌‍​‌');
  const [password, setPassword] = useState('');
  
  // File scanner state
  const [scanFile, setScanFile] = useState<File | null>(null);

  const [report, setReport] = useState<DetectionReport | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const handleScanText = async () => {
    setIsScanning(true);
    try {
      const res = await detectTextStego(scanText, password);
      setReport(res);
    } catch (e: any) {
      console.error(e);
    } finally {
      setIsScanning(false);
    }
  };

  const handleScanFile = async (file: File) => {
    setScanFile(file);
    setIsScanning(true);
    setReport(null);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);

      let imageData: ImageData | undefined = undefined;

      if (file.type.startsWith('image/')) {
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = async () => {
          const canvas = canvasRef.current || document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            imageData = ctx.getImageData(0, 0, img.width, img.height);
          }
          const res = await detectFileStego(bytes, imageData, password);
          setReport(res);
          setIsScanning(false);
        };
        img.src = url;
        return;
      }

      const res = await detectFileStego(bytes, undefined, password);
      setReport(res);
    } catch (e: any) {
      console.error(e);
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
      <canvas ref={canvasRef} className="hidden" />

      {/* Header */}
      <div className="bg-slate-900/80 rounded-xl border border-slate-800 p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 via-amber-600 to-yellow-500 flex items-center justify-center shadow-lg shadow-rose-500/20">
              <Search className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <span>智能隐写检测与分析中心</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-rose-950 text-rose-300 border border-rose-800">
                  Forensic Inspector
                </span>
              </h2>
              <p className="text-xs text-slate-400">一键扫描文本、图片与文件，鉴定隐藏字符、LSB像素熵与 Polyglot 容器威胁。</p>
            </div>
          </div>

          <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => { setActiveType('text'); setReport(null); }}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold ${
                activeType === 'text' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              检测文本
            </button>
            <button
              onClick={() => { setActiveType('file'); setReport(null); }}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold ${
                activeType === 'file' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              检测图片/文件
            </button>
          </div>
        </div>

        {/* Password Lock Input */}
        <div className="flex items-center space-x-3 text-xs font-mono">
          <span className="text-slate-400 whitespace-nowrap">智能解密尝试密码 (可选):</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-rose-500"
            placeholder="若隐写数据已加密，输入密码将自动解锁Payload..."
          />
        </div>

        {/* Input Area */}
        {activeType === 'text' ? (
          <div className="space-y-3">
            <textarea
              value={scanText}
              onChange={(e) => setScanText(e.target.value)}
              rows={4}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 font-mono leading-relaxed focus:outline-none focus:border-rose-500"
              placeholder="在此粘贴怀疑包含隐藏信息的文案、文本段落..."
            />
            <button
              onClick={handleScanText}
              disabled={isScanning}
              className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold shadow-lg shadow-rose-600/30 transition-all flex items-center justify-center space-x-2"
            >
              <Sparkles className="w-4 h-4 text-rose-200" />
              <span>{isScanning ? '正在深层算法鉴定中...' : '开始文本隐写深度深度鉴定'}</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <DropZoneInput
              accept="*/*"
              onFileSelected={(file) => handleScanFile(file)}
              previewUrl={scanFile && scanFile.type.startsWith('image/') ? URL.createObjectURL(scanFile) : null}
              fileName={scanFile?.name}
              fileSizeKB={scanFile ? parseFloat((scanFile.size / 1024).toFixed(1)) : undefined}
              placeholderText="点击、拖拽文件/图片到此处，或 Ctrl+V 直接粘贴"
              subText="支持 PNG, JPG, PDF, ZIP 等全格式深度安全隐写与 Polyglot 分析"
            />
          </div>
        )}
      </div>

      {/* Forensic Report Cards */}
      {report && (
        <div className="space-y-6 animate-fadeIn">
          {/* Main Risk Dashboard Card */}
          <div className={`rounded-xl border p-6 ${
            report.threatLevel === ThreatLevel.CONFIRMED
              ? 'bg-rose-950/40 border-rose-800 glow-rose'
              : report.threatLevel === ThreatLevel.SUSPICIOUS
              ? 'bg-amber-950/40 border-amber-800'
              : 'bg-emerald-950/40 border-emerald-800'
          }`}>
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
              <div className="flex items-center space-x-3">
                {report.threatLevel === ThreatLevel.CONFIRMED ? (
                  <ShieldAlert className="w-7 h-7 text-rose-400" />
                ) : report.threatLevel === ThreatLevel.SUSPICIOUS ? (
                  <AlertTriangle className="w-7 h-7 text-amber-400" />
                ) : (
                  <ShieldCheck className="w-7 h-7 text-emerald-400" />
                )}
                <div>
                  <h3 className="text-base font-bold text-white">{report.threatLevel}</h3>
                  <p className="text-xs text-slate-400 font-mono">总探测字符/字节: {report.totalLength} | 隐形/异常数: {report.invisibleCharCount}</p>
                </div>
              </div>

              <div className="text-right">
                <div className="text-2xl font-bold font-mono text-white">{report.riskScore} <span className="text-xs text-slate-400">/ 100</span></div>
                <div className="text-[10px] font-mono text-slate-400">隐写威胁指数</div>
              </div>
            </div>

            {/* Findings List */}
            <div className="mt-4 space-y-2">
              <span className="text-xs font-mono text-slate-400 font-semibold">// 深度扫描诊断细节:</span>
              {report.findings.map((finding, idx) => (
                <div key={idx} className="p-3 bg-slate-950/80 rounded-lg border border-slate-800 text-xs flex items-start space-x-2">
                  <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                    finding.severity === 'danger' ? 'bg-rose-400 animate-ping' : finding.severity === 'warning' ? 'bg-amber-400' : 'bg-blue-400'
                  }`} />
                  <div>
                    <p className="font-semibold text-slate-200">{finding.title}</p>
                    <p className="text-slate-400 leading-relaxed">{finding.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Extracted Payload Result Panel */}
            {report.extractedPacket && (
              <div className="mt-5 p-4 bg-slate-950 rounded-xl border border-rose-800/80 space-y-2">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-xs font-mono font-bold text-rose-300 flex items-center space-x-1">
                    <Unlock className="w-3.5 h-3.5 text-rose-400" />
                    <span>成功提取消化的绝密载荷 Payload</span>
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    Type: {report.extractedPacket.header.payloadType} | Len: {report.extractedPacket.header.payloadLength} B
                  </span>
                </div>
                {report.extractedPacket.payloadText && (
                  <div className="p-3 bg-slate-900 rounded font-mono text-xs text-emerald-300 leading-relaxed whitespace-pre-wrap select-all">
                    {report.extractedPacket.payloadText}
                  </div>
                )}
                {report.extractedPacket.payloadFile && (
                  <div className="flex items-center justify-between p-2 bg-slate-900 rounded">
                    <span className="text-xs font-mono text-slate-200">{report.extractedPacket.payloadFile.name}</span>
                    <a
                      href={URL.createObjectURL(new Blob([new Uint8Array(report.extractedPacket.payloadFile.data)]))}
                      download={report.extractedPacket.payloadFile.name}
                      className="px-3 py-1 bg-emerald-600 text-white rounded text-xs"
                    >
                      下载文件
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
