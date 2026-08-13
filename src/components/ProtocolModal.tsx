import React from 'react';
import { X, BookOpen, Shield, Code, CheckCircle, Cpu } from 'lucide-react';

interface ProtocolModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProtocolModal: React.FC<ProtocolModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-bold text-white">HiddenBox Protocol v1.0 (HBX 协议规范)</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm leading-relaxed text-slate-300 font-sans">
          {/* Protocol Header Structure */}
          <div>
            <h3 className="font-semibold text-white mb-2 flex items-center space-x-2">
              <Cpu className="w-4 h-4 text-emerald-400" />
              <span>数据包二进制结构 (Binary Packet Diagram)</span>
            </h3>
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs overflow-x-auto">
              <div className="text-slate-400 mb-2">// 15 字节 Header 头部 + 可变长 Payload</div>
              <div className="grid grid-cols-6 gap-2 text-center">
                <div className="p-2 bg-blue-950/80 border border-blue-800 text-blue-300 rounded">
                  <div className="font-bold">HBX1</div>
                  <div className="text-[10px] text-slate-400">4 Bytes Magic</div>
                </div>
                <div className="p-2 bg-purple-950/80 border border-purple-800 text-purple-300 rounded">
                  <div className="font-bold">0x01</div>
                  <div className="text-[10px] text-slate-400">1B Version</div>
                </div>
                <div className="p-2 bg-amber-950/80 border border-amber-800 text-amber-300 rounded">
                  <div className="font-bold">Flags</div>
                  <div className="text-[10px] text-slate-400">1B (AES/Comp)</div>
                </div>
                <div className="p-2 bg-indigo-950/80 border border-indigo-800 text-indigo-300 rounded">
                  <div className="font-bold">Type</div>
                  <div className="text-[10px] text-slate-400">1B Payload</div>
                </div>
                <div className="p-2 bg-emerald-950/80 border border-emerald-800 text-emerald-300 rounded">
                  <div className="font-bold">Length</div>
                  <div className="text-[10px] text-slate-400">4B Payload Len</div>
                </div>
                <div className="p-2 bg-rose-950/80 border border-rose-800 text-rose-300 rounded">
                  <div className="font-bold">CRC32</div>
                  <div className="text-[10px] text-slate-400">4B Checksum</div>
                </div>
              </div>
              <div className="mt-3 p-3 bg-slate-900 rounded border border-slate-800 text-center text-slate-200">
                [ Variable Length Payload Bytes ] (Direct String / Encrypted AES-GCM Ciphertext / Binary File)
              </div>
            </div>
          </div>

          {/* Encryption & Security */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800">
              <h4 className="font-semibold text-white mb-2 flex items-center space-x-1.5 text-xs">
                <Shield className="w-4 h-4 text-blue-400" />
                <span>安全与加解密机制</span>
              </h4>
              <ul className="text-xs space-y-1.5 text-slate-400 list-disc list-inside">
                <li>加密算法：AES-256-GCM 算法</li>
                <li>密钥派生：PBKDF2（100,000 次哈希迭代）</li>
                <li>随机 Salt (16B) 与 IV (12B) 动态生成</li>
                <li>完整性：CRC32 高速循环冗余校验</li>
              </ul>
            </div>

            <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800">
              <h4 className="font-semibold text-white mb-2 flex items-center space-x-1.5 text-xs">
                <Code className="w-4 h-4 text-emerald-400" />
                <span>载体编码支持</span>
              </h4>
              <ul className="text-xs space-y-1.5 text-slate-400 list-disc list-inside">
                <li>Text：Zero-Width / Variation Selector</li>
                <li>Image：LSB Pixel & Polyglot Append</li>
                <li>Web：HTML Comment / data-hbx</li>
                <li>QR：Dual-Layer URL Hash Anchor</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition-colors"
          >
            关闭协议说明
          </button>
        </div>
      </div>
    </div>
  );
};
