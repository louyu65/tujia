import React, { useState } from 'react';
import { Navbar, TabId } from './components/Navbar';
import { ProtocolModal } from './components/ProtocolModal';
import { ImageBinderTab } from './components/tabs/ImageBinderTab';
import { SocialCreatorTab } from './components/tabs/SocialCreatorTab';
import { TextStegoTab } from './components/tabs/TextStegoTab';
import { ImageStegoTab } from './components/tabs/ImageStegoTab';
import { FileEncapsulationTab } from './components/tabs/FileEncapsulationTab';
import { WebStegoTab } from './components/tabs/WebStegoTab';
import { DualQRTab } from './components/tabs/DualQRTab';
import { DetectorTab } from './components/tabs/DetectorTab';
import { AIMaskTab } from './components/tabs/AIMaskTab';
import { Eye } from 'lucide-react';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('binder');
  const [isProtocolModalOpen, setIsProtocolModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#0a0d14] text-slate-100 font-sans flex flex-col justify-between selection:bg-blue-600 selection:text-white">
      {/* Top Navbar */}
      <div>
        <Navbar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onOpenProtocol={() => setIsProtocolModalOpen(true)}
        />

        {/* Main Studio Body Container */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Active Tab Router */}
          {activeTab === 'binder' && <ImageBinderTab />}
          {activeTab === 'social' && <SocialCreatorTab />}
          {activeTab === 'text' && <TextStegoTab />}
          {activeTab === 'image' && <ImageStegoTab />}
          {activeTab === 'file' && <FileEncapsulationTab />}
          {activeTab === 'web' && <WebStegoTab />}
          {activeTab === 'qr' && <DualQRTab />}
          {activeTab === 'detector' && <DetectorTab />}
          {activeTab === 'ai-mask' && <AIMaskTab />}
        </main>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-[#0c101a] py-6 text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <Eye className="w-4 h-4 text-blue-500" />
            <span className="font-bold text-slate-300">HiddenBox ContentProof Studio</span>
            <span>- 智能隐写、发现协议与内容权益核销平台</span>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsProtocolModalOpen(true)}
              className="hover:text-slate-300 transition-colors"
            >
              Protocol v2.0 规范
            </button>
            <span>•</span>
            <span>SimHash 64B / Digest / Hybrid Content Proof</span>
            <span>•</span>
            <span className="text-emerald-400">100% Client-Side Safe</span>
          </div>
        </div>
      </footer>

      {/* Protocol Specification Modal */}
      <ProtocolModal
        isOpen={isProtocolModalOpen}
        onClose={() => setIsProtocolModalOpen(false)}
      />
    </div>
  );
};

export default App;
