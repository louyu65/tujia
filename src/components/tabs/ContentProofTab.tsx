import React, { useState } from 'react';
import { ShieldCheck, Award, FileCheck, Copy, Check, Sparkles, AlertCircle, Fingerprint, Ticket, Store, Search, Zap } from 'lucide-react';
import { generateContentProof, verifyContentProof, ProofVerificationResult } from '../../core/contentProof';

export const ContentProofTab: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'create' | 'verify'>('create');
  const [isShortMode, setIsShortMode] = useState(false);

  // Creator / Campaign Form
  const [campaignId, setCampaignId] = useState('CAMP-2026-SUMMER');
  const [creatorId, setCreatorId] = useState('KOL_RED_STYLE_88');
  const [couponCode, setCouponCode] = useState('OFF30-VIP-8899');
  const [rewardTitle, setRewardTitle] = useState('到店出示即可立减 30 元专属福利');
  const [baseText, setBaseText] = useState('今天打卡了市中心精品咖啡馆，强烈推荐手冲！凭本文案到店可享专属优惠哦～');

  const [generatedProof, setGeneratedProof] = useState<{ proofText: string; digest: string; simHash: string; shortCode: string } | null>(null);

  // Verification Form
  const [userSubmittedText, setUserSubmittedText] = useState('');
  const [verificationResult, setVerificationResult] = useState<ProofVerificationResult | null>(null);

  const [copied, setCopied] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Handle Proof Generation
  const handleGenerateProof = async () => {
    setErrorMsg('');
    if (!baseText.trim()) {
      setErrorMsg('博文推广内容不能为空');
      return;
    }

    setIsProcessing(true);
    try {
      const res = await generateContentProof(baseText, {
        campaignId,
        creatorId,
        couponCode,
        rewardTitle,
        timestamp: Date.now()
      }, isShortMode);
      setGeneratedProof(res);
    } catch (e: any) {
      setErrorMsg(`生成内容凭证失败: ${e.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Proof Verification
  const handleVerify = async () => {
    setErrorMsg('');
    setVerificationResult(null);

    if (!userSubmittedText.trim()) {
      setErrorMsg('请输入或粘贴消费者出示的内容文本');
      return;
    }

    setIsProcessing(true);
    try {
      const res = await verifyContentProof(userSubmittedText);
      setVerificationResult(res);
    } catch (e: any) {
      setErrorMsg(`核销验证失败: ${e.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-950/80 via-slate-900 to-indigo-950/80 rounded-2xl border border-blue-800/60 p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Award className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <span>Content Proof 内容权益与归因凭证</span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-500 text-white shadow">
                  HYBRID ENGINE
                </span>
              </h2>
              <p className="text-xs text-slate-300">内容即凭证 • 超短口令 / 零外显无痕隐写 • KOL 推广归因 • 优惠券无感核销</p>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-xs font-mono">
            <button
              onClick={() => setActiveSubTab('create')}
              className={`px-3 py-1.5 rounded-lg border transition-all ${
                activeSubTab === 'create' ? 'bg-blue-600 text-white border-blue-500 font-bold shadow' : 'bg-slate-900 text-slate-400 border-slate-800'
              }`}
            >
              绑定活动发布
            </button>
            <button
              onClick={() => setActiveSubTab('verify')}
              className={`px-3 py-1.5 rounded-lg border transition-all ${
                activeSubTab === 'verify' ? 'bg-emerald-600 text-white border-emerald-500 font-bold shadow' : 'bg-slate-900 text-slate-400 border-slate-800'
              }`}
            >
              商家核销识别
            </button>
          </div>
        </div>

        {/* Mode Selector: Short Oral Code vs Zero-Visual Stego */}
        <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono">
          <div className="flex items-center space-x-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <span className="text-slate-300 font-semibold">凭证表达模式选择:</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsShortMode(false)}
              className={`px-3 py-1 rounded-lg border transition-all ${
                !isShortMode
                  ? 'bg-blue-950 text-blue-300 border-blue-600 font-bold'
                  : 'bg-slate-900 text-slate-400 border-slate-800'
              }`}
            >
              🛡️ 零外显无痕嵌入 (文案长短不变，完美免显框)
            </button>
            <button
              onClick={() => setIsShortMode(true)}
              className={`px-3 py-1 rounded-lg border transition-all ${
                isShortMode
                  ? 'bg-amber-950 text-amber-300 border-amber-600 font-bold'
                  : 'bg-slate-900 text-slate-400 border-slate-800'
              }`}
            >
              ⚡ 超短口令暗号 (如 CP#X8K2 仅5-6字符，极速核销)
            </button>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 bg-rose-950/80 border border-rose-800/80 rounded-xl text-xs text-rose-200 flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Create Mode */}
      {activeSubTab === 'create' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fadeIn">
          <div className="bg-slate-900/80 rounded-xl border border-slate-800 p-5 space-y-4">
            <h3 className="text-sm font-semibold text-white flex items-center space-x-2">
              <Ticket className="w-4 h-4 text-blue-400" />
              <span>设置推广活动与绑定权益</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">活动 ID (Campaign ID):</label>
                <input
                  type="text"
                  value={campaignId}
                  onChange={(e) => setCampaignId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">KOL 创作者 ID:</label>
                <input
                  type="text"
                  value={creatorId}
                  onChange={(e) => setCreatorId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">权益/优惠券标识:</label>
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">权益标题描述:</label>
                <input
                  type="text"
                  value={rewardTitle}
                  onChange={(e) => setRewardTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-sans"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1.5">KOL 博文正文内容:</label>
              <textarea
                value={baseText}
                onChange={(e) => setBaseText(e.target.value)}
                rows={4}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 font-sans leading-relaxed focus:outline-none focus:border-blue-500"
              />
            </div>

            <button
              onClick={handleGenerateProof}
              disabled={isProcessing}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center space-x-2"
            >
              <Sparkles className="w-4 h-4 text-blue-200" />
              <span>{isProcessing ? '正在计算内容指纹并生成凭证...' : '生成凭证绑定博文'}</span>
            </button>
          </div>

          <div className="bg-slate-900/80 rounded-xl border border-slate-800 p-5 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
                <h3 className="text-sm font-semibold text-white">带有 Content Proof 凭证的博文</h3>
                {generatedProof && (
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(generatedProof.proofText);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="flex items-center space-x-1 text-xs text-blue-400 font-mono font-bold"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? '已复制' : '复制包含凭证的文案'}</span>
                  </button>
                )}
              </div>

              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-200 font-sans leading-relaxed min-h-[160px] whitespace-pre-wrap select-all break-all">
                {generatedProof ? generatedProof.proofText : <span className="text-slate-600 italic">在左侧设置活动参数并点击生成...</span>}
              </div>
            </div>

            {generatedProof && (
              <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-lg text-[11px] font-mono space-y-1 text-slate-400">
                <p className="text-amber-400 font-semibold">// 凭证识别指纹:</p>
                <p>• 口令代码 (ShortCode): <span className="text-white font-bold">{generatedProof.shortCode}</span></p>
                <p>• Content Digest: {generatedProof.digest}</p>
                <p>• SimHash 64Bit: {generatedProof.simHash}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Verify Mode */}
      {activeSubTab === 'verify' && (
        <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn">
          <div className="bg-slate-900/80 rounded-xl border border-slate-800 p-6 space-y-4">
            <h3 className="text-sm font-semibold text-white flex items-center space-x-2">
              <Store className="w-4 h-4 text-emerald-400" />
              <span>商家核销与来源归因识别</span>
            </h3>

            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1.5">粘贴消费者出示的内容文本 / 口令 (如 CP#X8K2 或隐写博文):</label>
              <textarea
                value={userSubmittedText}
                onChange={(e) => setUserSubmittedText(e.target.value)}
                rows={4}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 font-sans leading-relaxed focus:outline-none focus:border-emerald-500"
                placeholder="粘贴用户出示的内容或口令代码..."
              />
            </div>

            <button
              onClick={handleVerify}
              disabled={isProcessing}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center space-x-2"
            >
              <Search className="w-4 h-4" />
              <span>{isProcessing ? '正在验证内容指纹与签名...' : '开始核销与来源鉴定'}</span>
            </button>
          </div>

          {/* Verification Result Card */}
          {verificationResult && (
            <div className={`rounded-xl border p-6 space-y-4 animate-fadeIn ${
              verificationResult.isVerified
                ? 'bg-emerald-950/40 border-emerald-800 glow-emerald'
                : 'bg-rose-950/40 border-rose-800'
            }`}>
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-xs font-mono font-bold text-white flex items-center space-x-2">
                  <FileCheck className="w-4 h-4 text-emerald-400" />
                  <span>{verificationResult.verificationMessage}</span>
                </span>
                <span className="text-xs font-mono text-emerald-300 font-bold">
                  防伪评分: {verificationResult.antiCounterfeitScore} / 100
                </span>
              </div>

              {verificationResult.campaign && (
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3 font-mono text-xs">
                  <div className="text-emerald-400 font-bold border-b border-slate-800 pb-2 flex justify-between items-center">
                    <span>🎉 归因确认：{verificationResult.campaign.rewardTitle}</span>
                    <span className="text-slate-400 font-normal">核销代码: {verificationResult.campaign.couponCode}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-slate-300">
                    <div>带货 KOL 账号: <span className="text-white font-bold">{verificationResult.campaign.creatorId}</span></div>
                    <div>活动 Campaign: <span className="text-white font-bold">{verificationResult.campaign.campaignId}</span></div>
                    <div>指纹算法校验: <span className="text-emerald-400">{verificationResult.fingerprintMatch ? '100% 匹配' : '口令/内容匹配'}</span></div>
                    <div>创建时间戳: <span className="text-slate-400">{new Date(verificationResult.campaign.timestamp).toLocaleString()}</span></div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
