import React, { useState } from 'react';
import { Eye, Copy, Zap, Info, ShieldCheck, FileCode, Check } from 'lucide-react';
import { analyzeInvisibleCharacters, InvisibleCharToken } from '../core/textStego';

interface InvisibleSpotlightProps {
  text: string;
}

export const InvisibleSpotlight: React.FC<InvisibleSpotlightProps> = ({ text }) => {
  const [selectedToken, setSelectedToken] = useState<InvisibleCharToken | null>(null);
  const [copiedClean, setCopiedClean] = useState(false);
  const [copiedHex, setCopiedHex] = useState(false);

  const tokens = analyzeInvisibleCharacters(text);
  const invisibleTokens = tokens.filter(t => t.type !== 'normal');
  const invisibleCount = invisibleTokens.length;

  const handleCopyClean = () => {
    const cleanText = text.replace(/[\u200B-\u200D\u2060\uFE00-\uFE0F\u00A0]/g, '');
    navigator.clipboard.writeText(cleanText);
    setCopiedClean(true);
    setTimeout(() => setCopiedClean(false), 2000);
  };

  const handleCopyHex = () => {
    const encoder = new TextEncoder();
    const bytes = encoder.encode(text);
    const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ');
    navigator.clipboard.writeText(hex);
    setCopiedHex(true);
    setTimeout(() => setCopiedHex(false), 2000);
  };

  return (
    <div className="bg-slate-900/90 rounded-xl border border-slate-800 p-4 font-sans shadow-xl">
      {/* Header Info */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <Zap className="w-4 h-4 text-amber-400 animate-pulse" />
          <h3 className="text-sm font-semibold text-white">文本显形强光灯 (Invisible Spotlight)</h3>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-0.5 rounded text-xs font-mono font-medium ${
            invisibleCount > 0
              ? 'bg-rose-950/80 text-rose-300 border border-rose-800'
              : 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
          }`}>
            {invisibleCount > 0 ? `发现 ${invisibleCount} 个隐形字符` : '无隐藏字符'}
          </span>
        </div>
      </div>

      {/* Interactive Render Box */}
      <div className="mt-3 p-4 bg-slate-950 rounded-lg border border-slate-800/80 font-mono text-sm leading-relaxed min-h-[120px] max-h-[220px] overflow-y-auto whitespace-pre-wrap break-all select-text">
        {text.length === 0 ? (
          <span className="text-slate-600 italic">在上方输入或粘贴文本，强光灯将实时亮起并标记隐藏字符...</span>
        ) : (
          tokens.map((token, idx) => {
            if (token.type === 'normal') {
              return <span key={idx} className="text-slate-200">{token.char}</span>;
            }
            return (
              <span
                key={idx}
                onClick={() => setSelectedToken(token)}
                className="invisible-char-tag"
                title={`${token.name} (${token.codePoint})`}
              >
                [{token.char.replace('[', '').replace(']', '')} {token.codePoint}]
              </span>
            );
          })
        )}
      </div>

      {/* Selected Token Inspector Card */}
      {selectedToken && (
        <div className="mt-3 p-3 bg-rose-950/30 border border-rose-800/50 rounded-lg text-xs flex items-center justify-between animate-fadeIn">
          <div className="flex items-center space-x-3">
            <Info className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <div>
              <span className="font-semibold text-rose-200">{selectedToken.name}</span>
              <span className="ml-2 font-mono text-slate-400">位置: #{selectedToken.index} | 码位: {selectedToken.codePoint}</span>
            </div>
          </div>
          <button
            onClick={() => setSelectedToken(null)}
            className="text-slate-400 hover:text-slate-200 text-xs px-2 py-0.5"
          >
            关闭
          </button>
        </div>
      )}

      {/* Toolbar Quick Actions */}
      <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="text-slate-400 flex items-center space-x-1 font-mono">
          <Eye className="w-3.5 h-3.5 text-blue-400" />
          <span>总长: {text.length} 字符 | 绝密隐形占比: {text.length ? ((invisibleCount / text.length) * 100).toFixed(1) : 0}%</span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleCopyClean}
            disabled={!text}
            className="flex items-center space-x-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 font-mono transition-colors"
          >
            {copiedClean ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
            <span>{copiedClean ? '已复制明文' : '提取干净明文'}</span>
          </button>
          <button
            onClick={handleCopyHex}
            disabled={!text}
            className="flex items-center space-x-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 font-mono transition-colors"
          >
            {copiedHex ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <FileCode className="w-3.5 h-3.5 text-slate-400" />}
            <span>{copiedHex ? '已复制 Hex' : '导出 Hex 码流'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
