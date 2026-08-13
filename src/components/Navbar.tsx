import React, { useState } from 'react';
import { Eye, BookOpen, Layers, Image as ImageIcon, FileArchive, Globe, QrCode, Search, Sparkles, Flame, FolderArchive, Cpu, LayoutGrid } from 'lucide-react';

export type TabId = 'text' | 'image' | 'file' | 'web' | 'qr' | 'detector' | 'ai-mask' | 'social' | 'binder';

interface NavbarProps {
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
  onOpenProtocol: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, onOpenProtocol }) => {
  // Determine if active tab belongs to Core or Scenes
  const isSceneTab = activeTab === 'social' || activeTab === 'binder';
  const [activeCategory, setActiveCategory] = useState<'core' | 'scene'>(isSceneTab ? 'scene' : 'core');

  // Core Capabilities
  const coreItems: { id: TabId; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'text', label: '文本隐写', icon: <Layers className="w-3.5 h-3.5" /> },
    { id: 'image', label: '图片隐写', icon: <ImageIcon className="w-3.5 h-3.5" /> },
    { id: 'file', label: '文件封装', icon: <FileArchive className="w-3.5 h-3.5" /> },
    { id: 'web', label: 'Web/MD', icon: <Globe className="w-3.5 h-3.5" /> },
    { id: 'qr', label: '双重二维码', icon: <QrCode className="w-3.5 h-3.5" /> },
    { id: 'ai-mask', label: 'AI自然掩护', icon: <Sparkles className="w-3.5 h-3.5 text-purple-400" /> }
  ];

  // Scene Applications
  const sceneItems: { id: TabId; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'social', label: '小红书 / 抖音防封助手', icon: <Flame className="w-3.5 h-3.5 text-rose-400" />, badge: 'HOT' },
    { id: 'binder', label: '隐写图夹 (多图保险夹)', icon: <FolderArchive className="w-3.5 h-3.5 text-purple-400" />, badge: 'NEW' }
  ];

  const handleCategorySwitch = (cat: 'core' | 'scene') => {
    setActiveCategory(cat);
    if (cat === 'core' && isSceneTab) {
      setActiveTab('text');
    } else if (cat === 'scene' && !isSceneTab) {
      setActiveTab('social');
    }
  };

  return (
    <header className="border-b border-slate-800/80 bg-[#0c101a]/95 backdrop-blur sticky top-0 z-40 shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Navbar Line */}
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => { setActiveCategory('core'); setActiveTab('text'); }}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-rose-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Eye className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-blue-400 bg-clip-text text-transparent">
                  HiddenBox
                </span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-blue-950/80 text-blue-400 border border-blue-800/50 font-bold">
                  v2.0
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono hidden sm:block">智能数据隐写与安全凭证 Studio</p>
            </div>
          </div>

          {/* Center Category Switcher (Sleek Segment Control) */}
          <div className="flex items-center bg-slate-900/90 p-1.5 rounded-xl border border-slate-800/80 shadow-inner">
            <button
              onClick={() => handleCategorySwitch('core')}
              className={`flex items-center space-x-2 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                activeCategory === 'core'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>基础能力引擎</span>
              <span className="px-1.5 py-0.2 rounded-full bg-blue-950 text-blue-300 text-[10px] font-mono">
                {coreItems.length}
              </span>
            </button>

            <button
              onClick={() => handleCategorySwitch('scene')}
              className={`flex items-center space-x-2 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                activeCategory === 'scene'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>场景应用方案</span>
              <span className="px-1.5 py-0.2 rounded-full bg-rose-950 text-rose-300 text-[10px] font-mono">
                {sceneItems.length}
              </span>
            </button>
          </div>

          {/* Right Actions */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setActiveTab('detector')}
              className={`flex items-center space-x-1.5 text-xs font-mono font-semibold px-3 py-1.5 rounded-xl border transition-all ${
                activeTab === 'detector'
                  ? 'bg-emerald-600 text-white border-emerald-500 shadow-lg shadow-emerald-600/30'
                  : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-emerald-400'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              <span>智能检测中心</span>
            </button>

            <button
              onClick={onOpenProtocol}
              className="hidden sm:flex items-center space-x-1.5 text-xs font-mono px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 transition-colors"
            >
              <BookOpen className="w-3.5 h-3.5 text-blue-400" />
              <span>协议规范</span>
            </button>
          </div>
        </div>

        {/* Sub-bar Navigation Pills (Clean & Spacious) */}
        <div className="py-2.5 border-t border-slate-800/60 flex items-center justify-between overflow-x-auto no-scrollbar">
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-mono text-slate-500 pr-2 hidden sm:inline">
              {activeCategory === 'core' ? '选择隐写算法工具:' : '选择场景应用套件:'}
            </span>

            {(activeCategory === 'core' ? coreItems : sceneItems).map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap ${
                    isActive
                      ? activeCategory === 'core'
                        ? 'bg-slate-800 text-blue-400 border border-blue-500/50 font-bold shadow-sm'
                        : 'bg-slate-800 text-rose-400 border border-rose-500/50 font-bold shadow-sm'
                      : 'text-slate-400 bg-slate-900/60 hover:text-slate-200 border border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="ml-0.5 text-[9px] px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 font-mono font-bold">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="hidden md:flex items-center space-x-2 text-[11px] font-mono text-slate-500">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>纯前端内存加密算法驱动</span>
          </div>
        </div>
      </div>
    </header>
  );
};
