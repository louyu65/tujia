import React, { useState } from 'react';
import { Sparkles, ShieldCheck, Copy, Check, Lock, Unlock, PhoneCall, Gift, ShieldAlert, Heart, Share2, Flame, AlertCircle } from 'lucide-react';
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
  TextStegoMode
} from '../../core/textStego';

export const SocialCreatorTab: React.FC = () => {
  const [activePreset, setActivePreset] = useState<'contact' | 'gift' | 'watermark'>('contact');

  // Contact Hiding Form
  const [wechatId, setWechatId] = useState('wx_designer_888');
  const [coverTopic, setCoverTopic] = useState('今天分享这套绝美风衣搭配，版型真的超级显瘦！喜欢的姐妹可以评论区讨论哦～');
  const [contactStyle, setContactStyle] = useState<TextStegoMode>(TextStegoMode.KAOMOJI_CIPHER);
  const [contactResult, setContactResult] = useState('');

  // Fan Perk / Coupon Form
  const [perkCode, setPerkCode] = useState('百度网盘提取码：8899 | 独家优惠券：RED-VIP-666');
  const [perkResult, setPerkResult] = useState('');

  // Watermark Form
  const [creatorId, setCreatorId] = useState('小红书@穿搭小助手_UID9982');
  const [articleContent, setArticleContent] = useState('在这个快节奏的时代，拥有一套得体又舒适的穿搭是提升自信的关键。本文由创作者原创发布，严禁未经授权擅自搬运抄袭。');
  const [watermarkResult, setWatermarkResult] = useState('');

  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Handle Contact Hiding
  const handleGenerateContact = async () => {
    setErrorMsg('');
    if (!wechatId.trim()) {
      setErrorMsg('请输入要隐藏的微信 ID 或联系方式');
      return;
    }

    try {
      const secretStr = `联系方式/微信号: ${wechatId.trim()}`;
      const packet = await packPayload(secretStr, PayloadType.TEXT);

      let result = '';
      if (contactStyle === TextStegoMode.KAOMOJI_CIPHER) {
        result = coverTopic + '\n\n' + bytesToKaomojiSequence(packet);
      } else if (contactStyle === TextStegoMode.CYBER_SYMBOL) {
        result = coverTopic + '\n\n' + bytesToCyberSequence(packet);
      } else if (contactStyle === TextStegoMode.CN_HOMOGLYPH) {
        result = embedChineseHomoglyph(coverTopic, packet);
      } else {
        result = coverTopic + '\n\n' + bytesToEmojiSequence(packet);
      }

      setContactResult(result);
    } catch (e: any) {
      setErrorMsg(`生成失败: ${e.message}`);
    }
  };

  // Handle Perk Embedding
  const handleGeneratePerk = async () => {
    setErrorMsg('');
    if (!perkCode.trim()) {
      setErrorMsg('请输入资源提取码或优惠券');
      return;
    }

    try {
      const packet = await packPayload(perkCode.trim(), PayloadType.TEXT);
      const result = coverTopic + '\n\n🎁 粉丝专属彩蛋暗号：' + bytesToKaomojiSequence(packet);
      setPerkResult(result);
    } catch (e: any) {
      setErrorMsg(`生成失败: ${e.message}`);
    }
  };

  // Handle Watermark Embedding
  const handleGenerateWatermark = async () => {
    setErrorMsg('');
    if (!creatorId.trim() || !articleContent.trim()) {
      setErrorMsg('请输入创作者 ID 和正文内容');
      return;
    }

    try {
      const markStr = `版权归属证明: ${creatorId.trim()} | 时间: ${new Date().toLocaleString()}`;
      const packet = await packPayload(markStr, PayloadType.TEXT);
      const result = embedChineseHomoglyph(articleContent, packet);
      setWatermarkResult(result);
    } catch (e: any) {
      setErrorMsg(`水印埋入失败: ${e.message}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-rose-950/80 via-slate-900 to-purple-950/80 rounded-2xl border border-rose-800/60 p-6 space-y-3 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-rose-500 to-pink-500 flex items-center justify-center shadow-lg shadow-rose-500/30">
              <Flame className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                <span>小红书 / 抖音创作者专属助手</span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500 text-white shadow">
                  PRO CREATOR
                </span>
              </h2>
              <p className="text-xs text-slate-300">防平台风控引流封号 • 粉丝彩蛋福利锁 • 文案防搬运版权水印</p>
            </div>
          </div>

          <div className="hidden sm:flex items-center space-x-2 text-xs font-mono text-emerald-400 bg-emerald-950/80 px-3 py-1.5 rounded-xl border border-emerald-800">
            <ShieldCheck className="w-4 h-4" />
            <span>100% 免疫平台关键词检测</span>
          </div>
        </div>

        {/* Feature Selector Tabs */}
        <div className="grid grid-cols-3 gap-2 pt-2">
          <button
            onClick={() => setActivePreset('contact')}
            className={`p-3 rounded-xl text-xs font-bold border flex items-center justify-center space-x-2 transition-all ${
              activePreset === 'contact'
                ? 'bg-rose-600 text-white border-rose-500 shadow-lg shadow-rose-600/30'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            <PhoneCall className="w-4 h-4" />
            <span>📱 微信/私域防封引流</span>
          </button>
          <button
            onClick={() => setActivePreset('gift')}
            className={`p-3 rounded-xl text-xs font-bold border flex items-center justify-center space-x-2 transition-all ${
              activePreset === 'gift'
                ? 'bg-purple-600 text-white border-purple-500 shadow-lg shadow-purple-600/30'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            <Gift className="w-4 h-4" />
            <span>🎁 粉丝专属彩蛋/提取码</span>
          </button>
          <button
            onClick={() => setActivePreset('watermark')}
            className={`p-3 rounded-xl text-xs font-bold border flex items-center justify-center space-x-2 transition-all ${
              activePreset === 'watermark'
                ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-600/30'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>🛡️ 博主防搬运数字水印</span>
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 bg-rose-950/80 border border-rose-800/80 rounded-xl text-xs text-rose-200 flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Preset 1: Contact Hiding */}
      {activePreset === 'contact' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fadeIn">
          <div className="bg-slate-900/80 rounded-xl border border-slate-800 p-5 space-y-4">
            <h3 className="text-sm font-semibold text-white flex items-center space-x-2">
              <PhoneCall className="w-4 h-4 text-rose-400" />
              <span>隐藏微信号 / 手机号 / 导流口令</span>
            </h3>

            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1.5">需要安全的私域微信号 / 手机号:</label>
              <input
                type="text"
                value={wechatId}
                onChange={(e) => setWechatId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-rose-500"
                placeholder="如 wx_designer_888"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1.5">小红书 / 抖音公开种草文案:</label>
              <textarea
                value={coverTopic}
                onChange={(e) => setCoverTopic(e.target.value)}
                rows={4}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 font-sans leading-relaxed focus:outline-none focus:border-rose-500"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1.5">隐写包装样式:</label>
              <select
                value={contactStyle}
                onChange={(e) => setContactStyle(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 font-semibold focus:outline-none focus:border-rose-500"
              >
                <option value={TextStegoMode.KAOMOJI_CIPHER}> (⁠๑⁠•⁠̀⁠ㅂ⁠•⁠́⁠)⁠و✧ 颜文字卖萌流 (最强推荐，完美合规)</option>
                <option value={TextStegoMode.CYBER_SYMBOL}>🔥✨🎉 爆款社交符号流 (朋友圈点缀风)</option>
                <option value={TextStegoMode.CN_HOMOGLYPH}>🛡️ 中文同形字 (埋入文案字符中，无新符号)</option>
                <option value={TextStegoMode.EMOJI_CIPHER}>😀 Standard Emoji 表达式</option>
              </select>
            </div>

            <button
              onClick={handleGenerateContact}
              className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold shadow-lg shadow-rose-600/30 transition-all flex items-center justify-center space-x-2"
            >
              <Sparkles className="w-4 h-4 text-rose-200" />
              <span>生成防封导流文案</span>
            </button>
          </div>

          <div className="bg-slate-900/80 rounded-xl border border-slate-800 p-5 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
                <h3 className="text-sm font-semibold text-white">一键复制发帖文案</h3>
                {contactResult && (
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(contactResult);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="flex items-center space-x-1 text-xs text-rose-400 font-mono font-bold"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? '已复制到剪贴板' : '复制直发小红书'}</span>
                  </button>
                )}
              </div>

              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-200 font-sans leading-relaxed min-h-[160px] whitespace-pre-wrap select-all break-all">
                {contactResult || <span className="text-slate-600 italic">在左侧设置微信号后点击生成...</span>}
              </div>
            </div>

            <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-lg text-[11px] text-slate-400 font-mono space-y-1">
              <p className="text-rose-400 font-semibold">// 小红书防封说明:</p>
              <p>• 风控检测机器人只看到表面的卖萌表情或正常句子，零敏感词匹配。</p>
              <p>• 粉丝将文案复制到 HiddenBox 或专用微信小工具，100% 提取微信号。</p>
            </div>
          </div>
        </div>
      )}

      {/* Preset 2: Fan Perk */}
      {activePreset === 'gift' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fadeIn">
          <div className="bg-slate-900/80 rounded-xl border border-slate-800 p-5 space-y-4">
            <h3 className="text-sm font-semibold text-white flex items-center space-x-2">
              <Gift className="w-4 h-4 text-purple-400" />
              <span>隐藏网盘提取码 / 专属优惠券</span>
            </h3>

            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1.5">隐藏福利暗号 (网盘提取码 / 优惠卷):</label>
              <textarea
                value={perkCode}
                onChange={(e) => setPerkCode(e.target.value)}
                rows={3}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 font-mono focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1.5">表面文案:</label>
              <textarea
                value={coverTopic}
                onChange={(e) => setCoverTopic(e.target.value)}
                rows={3}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 font-sans leading-relaxed focus:outline-none focus:border-purple-500"
              />
            </div>

            <button
              onClick={handleGeneratePerk}
              className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold shadow-lg shadow-purple-600/30 transition-all"
            >
              生成粉丝彩蛋暗号文案
            </button>
          </div>

          <div className="bg-slate-900/80 rounded-xl border border-slate-800 p-5 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
                <h3 className="text-sm font-semibold text-white">生成的福利彩蛋文案</h3>
                {perkResult && (
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(perkResult);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="flex items-center space-x-1 text-xs text-purple-400 font-mono font-bold"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? '已复制到剪贴板' : '复制文案'}</span>
                  </button>
                )}
              </div>

              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-200 font-sans leading-relaxed min-h-[160px] whitespace-pre-wrap select-all break-all">
                {perkResult || <span className="text-slate-600 italic">在左侧设置福利暗号后点击生成...</span>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preset 3: Watermark */}
      {activePreset === 'watermark' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fadeIn">
          <div className="bg-slate-900/80 rounded-xl border border-slate-800 p-5 space-y-4">
            <h3 className="text-sm font-semibold text-white flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4 text-blue-400" />
              <span>博主防搬运数字水印埋入</span>
            </h3>

            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1.5">创作者标识 / UID / 名字:</label>
              <input
                type="text"
                value={creatorId}
                onChange={(e) => setCreatorId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1.5">博文正文 (将水印无感植入汉字中):</label>
              <textarea
                value={articleContent}
                onChange={(e) => setArticleContent(e.target.value)}
                rows={4}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 font-sans leading-relaxed focus:outline-none focus:border-blue-500"
              />
            </div>

            <button
              onClick={handleGenerateWatermark}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-lg shadow-blue-600/30 transition-all"
            >
              埋入隐形版权水印
            </button>
          </div>

          <div className="bg-slate-900/80 rounded-xl border border-slate-800 p-5 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
                <h3 className="text-sm font-semibold text-white">带水印文章 (外观完全一致)</h3>
                {watermarkResult && (
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(watermarkResult);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="flex items-center space-x-1 text-xs text-blue-400 font-mono font-bold"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? '已复制文案' : '复制水印文章'}</span>
                  </button>
                )}
              </div>

              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-200 font-sans leading-relaxed min-h-[160px] whitespace-pre-wrap select-all break-all">
                {watermarkResult || <span className="text-slate-600 italic">在左侧设置并点击埋入...</span>}
              </div>
            </div>

            <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-lg text-[11px] text-slate-400 font-mono space-y-1">
              <p className="text-blue-400 font-semibold">// 维权原理:</p>
              <p>• 同行即使复制抄袭你的文章，水印依然伴随文本存在。</p>
              <p>• 随时回到【智能检测中心】粘贴该文章，即可一键证明原创版权！</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
