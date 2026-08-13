import React, { useState, useRef } from 'react';
import { FolderArchive, Upload, Download, Lock, Unlock, AlertCircle, FileImage, Trash2, Sparkles, Check, Images } from 'lucide-react';
import { embedImageContainer, extractImageContainer, calculateImageCapacity, embedLSBPayload, extractLSBPayload } from '../../core/imageStego';
import { packPayload, unpackPayload, PayloadType } from '../../core/protocol';
import { DropZoneInput } from '../DropZoneInput';

interface SecretFileItem {
  id: string;
  file: File;
  name: string;
  sizeKB: number;
  previewUrl: string;
}

interface ExtractedImageItem {
  name: string;
  url: string;
  sizeKB: number;
}

export const ImageBinderTab: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'pack' | 'unpack'>('pack');

  // Pack Binder States
  const [coverImage, setCoverImage] = useState<File | Blob | null>(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | null>(null);
  const [coverFileName, setCoverFileName] = useState<string>('preset_binder_cover.png');
  const [secretFiles, setSecretFiles] = useState<SecretFileItem[]>([]);
  const [password, setPassword] = useState('');

  const [stegoResultUrl, setStegoResultUrl] = useState<string | null>(null);
  const [resultNotice, setResultNotice] = useState<string | null>(null);

  // Unpack Binder States
  const [stegoInputImage, setStegoInputImage] = useState<File | null>(null);
  const [unpackPassword, setUnpackPassword] = useState('');
  const [extractedImages, setExtractedImages] = useState<ExtractedImageItem[]>([]);

  const [errorMsg, setErrorMsg] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Procedural Art Cover Wallpaper Generator for Binder
  const generatePresetCover = (): Promise<Blob> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 600;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const seedHex = Math.floor(Math.random() * 0xFFFFFF).toString(16).padStart(6, '0');
      const mainHue = Math.floor(Math.random() * 360);

      const grad = ctx.createLinearGradient(0, 0, 800, 600);
      grad.addColorStop(0, `hsl(${mainHue}, 80%, 12%)`);
      grad.addColorStop(1, `hsl(${(mainHue + 120) % 360}, 90%, 6%)`);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 800, 600);

      // Decorative geometric grid & vault circles
      ctx.strokeStyle = `hsla(${mainHue}, 100%, 65%, 0.15)`;
      ctx.lineWidth = 1;
      for (let x = 0; x < 800; x += 40) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 600); ctx.stroke();
      }

      ctx.shadowColor = `hsl(${mainHue}, 100%, 65%)`;
      ctx.shadowBlur = 15;
      ctx.strokeStyle = `hsla(${mainHue}, 100%, 70%, 0.6)`;
      ctx.lineWidth = 2;
      for (let r = 80; r <= 220; r += 70) {
        ctx.beginPath(); ctx.arc(400, 300, r, 0, Math.PI * 2); ctx.stroke();
      }
      ctx.shadowBlur = 0;

      canvas.toBlob((blob) => {
        if (blob) {
          setCoverImage(blob);
          setCoverPreviewUrl(URL.createObjectURL(blob));
          setCoverFileName(`binder_cover_${seedHex}.png`);
          resolve(blob);
        }
      }, 'image/png');
    });
  };

  // Upload Cover Image
  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg('');
    const file = e.target.files?.[0];
    if (!file) return;

    setCoverImage(file);
    setCoverFileName(file.name);
    setCoverPreviewUrl(URL.createObjectURL(file));
  };

  // Upload Batch Secret Images to Binder
  const handleSecretFilesUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg('');
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newItems: SecretFileItem[] = [];
    Array.from(files).forEach((file) => {
      newItems.push({
        id: Math.random().toString(36).substring(2, 9),
        file,
        name: file.name,
        sizeKB: parseFloat((file.size / 1024).toFixed(1)),
        previewUrl: URL.createObjectURL(file)
      });
    });

    setSecretFiles((prev) => [...prev, ...newItems]);
  };

  const removeSecretFile = (id: string) => {
    setSecretFiles((prev) => prev.filter((item) => item.id !== id));
  };

  // Convert File to Base64 String
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  };

  // Pack Multiple Images into Binder
  const handlePackBinder = async () => {
    setErrorMsg('');
    setStegoResultUrl(null);
    setResultNotice(null);

    if (secretFiles.length === 0) {
      setErrorMsg('请至少添加 1 张秘密照片放入图夹');
      return;
    }

    setIsProcessing(true);

    try {
      // 1. If no cover image selected, generate dynamic wallpaper
      let activeCoverBlob = coverImage;
      if (!activeCoverBlob) {
        activeCoverBlob = await generatePresetCover();
      }

      // 2. Build multi-image container JSON structure
      const imagePayloadList = await Promise.all(
        secretFiles.map(async (item) => {
          const b64 = await fileToBase64(item.file);
          return {
            name: item.name,
            dataUrl: b64
          };
        })
      );

      const binderManifest = JSON.stringify({
        type: 'HIDDENBOX_IMAGE_BINDER_V1',
        count: imagePayloadList.length,
        images: imagePayloadList
      });

      // 3. Pack payload packet
      const payloadPacket = await packPayload(binderManifest, PayloadType.JSON, password);

      // 4. Embed into Cover Image via Polyglot Container / LSB
      const arrayBuffer = await activeCoverBlob!.arrayBuffer();
      const coverBytes = new Uint8Array(arrayBuffer);
      const stegoBytes = embedImageContainer(coverBytes, payloadPacket);

      const resultBlob = new Blob([new Uint8Array(stegoBytes)], { type: (activeCoverBlob as File).type || 'image/png' });
      const resultUrl = URL.createObjectURL(resultBlob);

      setStegoResultUrl(resultUrl);
      setResultNotice(`🎉 图夹封装成功！已将 ${secretFiles.length} 张秘密照片隐藏在一张外观掩护图中。下载后发送图片即可，随时可一键解密还原！`);
    } catch (e: any) {
      setErrorMsg(`封装图夹失败: ${e.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Unpack Stego Binder
  const handleUnpackBinder = async () => {
    setErrorMsg('');
    setExtractedImages([]);

    if (!stegoInputImage) {
      setErrorMsg('请选择包含图夹的隐写图片文件');
      return;
    }

    setIsProcessing(true);

    try {
      const arrayBuffer = await stegoInputImage.arrayBuffer();
      const fileBytes = new Uint8Array(arrayBuffer);

      let payloadBytes: Uint8Array | null = null;

      try {
        payloadBytes = extractImageContainer(fileBytes);
      } catch {
        payloadBytes = null;
      }

      if (!payloadBytes) {
        throw new Error('未在该图片中检测到有效的 HiddenBox 图夹封装数据');
      }

      const unpacked = await unpackPayload(payloadBytes, unpackPassword);
      const manifestStr = unpacked.payloadText || JSON.stringify(unpacked.payloadJson);
      const manifest = JSON.parse(manifestStr);

      if (manifest.type !== 'HIDDENBOX_IMAGE_BINDER_V1' || !Array.isArray(manifest.images)) {
        throw new Error('解密成功，但提取出的数据不是标准的 HiddenBox 多图图夹格式');
      }

      const extractedList: ExtractedImageItem[] = manifest.images.map((img: any) => {
        // Estimate size in KB
        const approxSize = Math.round((img.dataUrl.length * 3) / 4 / 1024);
        return {
          name: img.name || 'secret_photo.png',
          url: img.dataUrl,
          sizeKB: approxSize
        };
      });

      setExtractedImages(extractedList);
    } catch (e: any) {
      setErrorMsg(`解密图夹失败: ${e.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadSingleExtracted = (img: ExtractedImageItem) => {
    const a = document.createElement('a');
    a.href = img.url;
    a.download = img.name;
    a.click();
  };

  const downloadAllExtracted = () => {
    extractedImages.forEach((img, idx) => {
      setTimeout(() => {
        downloadSingleExtracted(img);
      }, idx * 250);
    });
  };

  const totalSecretSizeKB = secretFiles.reduce((sum, f) => sum + f.sizeKB, 0);

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
      {/* Top Banner */}
      <div className="bg-slate-900/80 rounded-xl border border-slate-800 p-5 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-purple-950/80 border border-purple-800 flex items-center justify-center text-purple-400">
            <FolderArchive className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white flex items-center space-x-2">
              <span>隐写多图图夹 (Stego Image Binder)</span>
              <span className="px-2 py-0.5 rounded bg-purple-950 text-purple-300 text-[10px] font-mono border border-purple-800/60 font-bold">
                多图保险保险夹
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              将 2 ~ 20 张秘密照片打包隐写隐藏在 1 张普通的社交封面图中，自带 AES-256 口令安全锁！
            </p>
          </div>
        </div>

        {/* SubTab Switcher */}
        <div className="flex items-center bg-slate-950 p-1.5 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveSubTab('pack')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all ${
              activeSubTab === 'pack'
                ? 'bg-purple-600 text-white font-bold shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>📦 生成打包图夹</span>
          </button>
          <button
            onClick={() => setActiveSubTab('unpack')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all ${
              activeSubTab === 'unpack'
                ? 'bg-emerald-600 text-white font-bold shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Unlock className="w-3.5 h-3.5" />
            <span>🔓 解密还原图夹</span>
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 bg-rose-950/80 border border-rose-800/80 rounded-xl text-xs text-rose-200 flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* PACK BINDER SECTION */}
      {activeSubTab === 'pack' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Inputs */}
          <div className="bg-slate-900/80 rounded-xl border border-slate-800 p-5 space-y-5">
            <h3 className="text-sm font-semibold text-white flex items-center space-x-2 border-b border-slate-800 pb-2">
              <Images className="w-4 h-4 text-purple-400" />
              <span>设置外壳掩护图与秘密照片列表</span>
            </h3>

            {/* Step 1: Cover Image */}
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1.5">1. 外壳掩护图 (支持拖拽 / Ctrl+V 粘贴):</label>
              <DropZoneInput
                onFileSelected={(file) => {
                  setErrorMsg('');
                  setCoverImage(file);
                  setCoverFileName(file.name);
                  setCoverPreviewUrl(URL.createObjectURL(file));
                }}
                previewUrl={coverPreviewUrl}
                fileName={coverFileName}
                placeholderText="点击、拖拽图片，或按 Ctrl+V 粘贴封面图"
                subText="点击上传封面图，或直接使用自动生成的精美几何壁纸"
              />
            </div>

            {/* Step 2: Batch Secret Images Upload */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-mono text-slate-300 font-bold">
                  2. 放入图夹的秘密照片 ({secretFiles.length} 张, 共 {totalSecretSizeKB.toFixed(1)} KB):
                </label>
              </div>

              <DropZoneInput
                compact
                multiple
                onFileSelected={(file) => {
                  setErrorMsg('');
                  setSecretFiles(prev => [...prev, {
                    id: Math.random().toString(36).substring(2, 9),
                    file,
                    name: file.name,
                    sizeKB: parseFloat((file.size / 1024).toFixed(1)),
                    previewUrl: URL.createObjectURL(file)
                  }]);
                }}
                onFilesSelected={(files) => {
                  setErrorMsg('');
                  const newItems: SecretFileItem[] = [];
                  Array.from(files).forEach((file) => {
                    if (file.type.startsWith('image/')) {
                      newItems.push({
                        id: Math.random().toString(36).substring(2, 9),
                        file,
                        name: file.name,
                        sizeKB: parseFloat((file.size / 1024).toFixed(1)),
                        previewUrl: URL.createObjectURL(file)
                      });
                    }
                  });
                  setSecretFiles(prev => [...prev, ...newItems]);
                }}
                placeholderText="点击、批量拖拽多张秘密照片，或 Ctrl+V 粘贴照片"
              />

              {/* Secret Images Grid Preview */}
              {secretFiles.length > 0 && (
                <div className="mt-3 max-h-[180px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                  {secretFiles.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-2 bg-slate-950 rounded-lg border border-slate-800">
                      <div className="flex items-center space-x-3 truncate">
                        <img src={item.previewUrl} alt={item.name} className="w-9 h-9 object-cover rounded border border-purple-800/50" />
                        <div className="text-xs font-mono truncate">
                          <p className="text-slate-200 font-bold truncate max-w-[180px]">{item.name}</p>
                          <p className="text-slate-500 text-[10px]">{item.sizeKB} KB</p>
                        </div>
                      </div>
                      <button
                        onClick={() => removeSecretFile(item.id)}
                        className="p-1 hover:bg-rose-950 text-slate-500 hover:text-rose-400 rounded transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Step 3: Optional AES Lock */}
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1.5">3. 图夹安全密码锁 (可选 AES-256 口令):</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500 font-mono"
                placeholder="留空表示不设置解密密码..."
              />
            </div>

            <button
              onClick={handlePackBinder}
              disabled={isProcessing}
              className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold shadow-lg shadow-purple-600/30 transition-all flex items-center justify-center space-x-2"
            >
              <Sparkles className="w-4 h-4 text-purple-200" />
              <span>{isProcessing ? '正在将多张照片隐写打包中...' : `一键打包生成隐写图夹 (藏入 ${secretFiles.length} 张照片)`}</span>
            </button>
          </div>

          {/* Right Output */}
          <div className="bg-slate-900/80 rounded-xl border border-slate-800 p-5 space-y-4 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white mb-3">生成的隐写图夹 (外观为单张正常封面照片)</h3>
              {stegoResultUrl ? (
                <div className="space-y-4">
                  <div className="relative border border-purple-800/80 rounded-xl overflow-hidden bg-slate-950 flex items-center justify-center p-2 max-h-[300px] shadow-2xl">
                    <img src={stegoResultUrl} alt="Stego Result Binder" className="max-h-[280px] object-contain rounded" />
                    <div className="absolute top-2 right-2 px-2.5 py-1 bg-purple-950/90 border border-purple-700 text-purple-300 text-[10px] font-mono rounded-lg font-bold shadow flex items-center space-x-1">
                      <FolderArchive className="w-3 h-3 text-purple-400" />
                      <span>图夹隐写成功 (已藏 {secretFiles.length} 图)</span>
                    </div>
                  </div>

                  <a
                    href={stegoResultUrl}
                    download={`binder_${coverFileName}`}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center space-x-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>下载隐写图夹照片 (PNG无损格式)</span>
                  </a>
                </div>
              ) : (
                <div className="h-[280px] border border-slate-800/80 rounded-xl bg-slate-950 flex items-center justify-center text-slate-600 text-xs italic">
                  在左侧添加秘密照片并点击打包图夹...
                </div>
              )}
            </div>

            {resultNotice && (
              <div className="p-3 bg-purple-950/60 border border-purple-800 rounded-lg text-[11px] text-purple-300 font-mono leading-relaxed">
                {resultNotice}
              </div>
            )}
          </div>
        </div>
      )}

      {/* UNPACK BINDER SECTION */}
      {activeSubTab === 'unpack' && (
        <div className="space-y-6">
          <div className="bg-slate-900/80 rounded-xl border border-slate-800 p-6 space-y-4">
            <h3 className="text-sm font-semibold text-white flex items-center space-x-2">
              <Unlock className="w-4 h-4 text-emerald-400" />
              <span>选择隐写图夹照片并解密还原所有秘密相册</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1.5">选择隐写图夹图片 (支持 Ctrl+V / 拖拽):</label>
                <DropZoneInput
                  onFileSelected={(file) => {
                    setErrorMsg('');
                    setStegoInputImage(file);
                  }}
                  previewUrl={stegoInputImage ? URL.createObjectURL(stegoInputImage) : null}
                  fileName={stegoInputImage?.name}
                  fileSizeKB={stegoInputImage ? parseFloat((stegoInputImage.size / 1024).toFixed(1)) : undefined}
                  placeholderText="点击、拖拽隐写图夹图片，或 Ctrl+V 粘贴"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1.5">图夹解密密码 (如设置了 AES 口令):</label>
                <input
                  type="password"
                  value={unpackPassword}
                  onChange={(e) => setUnpackPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
                  placeholder="无密码请留空..."
                />
              </div>
            </div>

            <button
              onClick={handleUnpackBinder}
              disabled={isProcessing}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center space-x-2"
            >
              <FolderArchive className="w-4 h-4" />
              <span>{isProcessing ? '正在解密提取图夹照片集中...' : '一键解密还原图夹相册'}</span>
            </button>
          </div>

          {/* Extracted Images Gallery Grid */}
          {extractedImages.length > 0 && (
            <div className="bg-slate-900/90 rounded-xl border border-emerald-800 p-6 space-y-4 animate-fadeIn shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <span className="text-sm font-bold text-emerald-400 flex items-center space-x-2">
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>🎉 成功解密图夹！共提取出 {extractedImages.length} 张秘密照片</span>
                  </span>
                </div>

                <button
                  onClick={downloadAllExtracted}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow flex items-center space-x-1.5 transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>批量一键下载所有秘密照片</span>
                </button>
              </div>

              {/* Gallery Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-2">
                {extractedImages.map((img, idx) => (
                  <div key={idx} className="bg-slate-950 rounded-xl border border-slate-800 p-3 space-y-3 flex flex-col justify-between hover:border-purple-500/50 transition-colors">
                    <div className="space-y-2">
                      <div className="h-40 bg-slate-900 rounded-lg overflow-hidden flex items-center justify-center border border-slate-800">
                        <img src={img.url} alt={img.name} className="h-full w-full object-cover" />
                      </div>
                      <div className="text-xs font-mono truncate">
                        <p className="text-slate-200 font-bold truncate">{img.name}</p>
                        <p className="text-slate-500 text-[10px]">{img.sizeKB} KB</p>
                      </div>
                    </div>

                    <button
                      onClick={() => downloadSingleExtracted(img)}
                      className="w-full py-1.5 bg-slate-800 hover:bg-purple-600 text-slate-200 hover:text-white rounded-lg text-xs font-mono font-semibold transition-all flex items-center justify-center space-x-1"
                    >
                      <Download className="w-3 h-3" />
                      <span>单张下载照片</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
