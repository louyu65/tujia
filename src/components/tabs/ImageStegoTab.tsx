import React, { useState, useRef, useEffect } from 'react';
import { Image as ImageIcon, Upload, Download, Lock, Unlock, AlertCircle, FileText, Check, Layers, Cpu, Sparkles, Shuffle, FileImage, Zap } from 'lucide-react';
import { calculateImageCapacity, embedLSBPayload, extractLSBPayload, embedImageContainer, extractImageContainer } from '../../core/imageStego';
import { packPayload, unpackPayload, PayloadType } from '../../core/protocol';
import { DropZoneInput } from '../DropZoneInput';

export const ImageStegoTab: React.FC = () => {
  const [mode, setMode] = useState<'auto' | 'lsb' | 'container'>('auto');
  const [activeSubTab, setActiveSubTab] = useState<'encode' | 'decode'>('encode');
  const [payloadMode, setPayloadMode] = useState<'text' | 'image'>('text');

  // Cover Image States
  const [isUserUploadedCover, setIsUserUploadedCover] = useState(false);
  const [coverImage, setCoverImage] = useState<File | Blob | null>(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | null>(null);
  const [coverFileName, setCoverFileName] = useState<string>('preset_cover.png');
  const [imageCapacity, setImageCapacity] = useState<{ width: number; height: number; maxBytesLSB1: number } | null>(null);

  // Secret Payload States
  const [secretText, setSecretText] = useState('这是隐藏在图片底层像素中的绝密机密档案！');
  const [secretImageFile, setSecretImageFile] = useState<File | null>(null);
  const [secretImagePreviewUrl, setSecretImagePreviewUrl] = useState<string | null>(null);

  const [password, setPassword] = useState('');

  // Result States
  const [stegoResultUrl, setStegoResultUrl] = useState<string | null>(null);
  const [stegoResultBytes, setStegoResultBytes] = useState<Uint8Array | null>(null);
  const [usedModeNotice, setUsedModeNotice] = useState<string | null>(null);

  // Decode State
  const [stegoInputImage, setStegoInputImage] = useState<File | null>(null);
  const [decodePassword, setDecodePassword] = useState('');
  const [decodedSecretText, setDecodedSecretText] = useState<string | null>(null);
  const [decodedSecretImage, setDecodedSecretImage] = useState<{ name: string; url: string; sizeKB: number } | null>(null);

  const [errorMsg, setErrorMsg] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Hilbert Curve Helper (1D index to 2D grid coordinates)
  const d2xy = (n: number, d: number): [number, number] => {
    let rx: number, ry: number, s: number, t = d;
    let x = 0, y = 0;
    for (s = 1; s < n; s *= 2) {
      rx = 1 & Math.floor(t / 2);
      ry = 1 & (t ^ rx);
      if (ry === 0) {
        if (rx === 1) {
          x = s - 1 - x;
          y = s - 1 - y;
        }
        const temp = x; x = y; y = temp;
      }
      x += s * rx;
      y += s * ry;
      t = Math.floor(t / 4);
    }
    return [x, y];
  };

  // High-End Mathematical Curves & Generative Art Engine
  const generatePresetCoverAsync = (requestedStyle?: string): Promise<{ blob: Blob; url: string; fileName: string }> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 600;
      const ctx = canvas.getContext('2d')!;

      const seedHex = Math.floor(Math.random() * 0xFFFFFF).toString(16).padStart(6, '0');
      const styles = [
        'lissajous', 'spirograph', 'butterfly', 'hilbert', 
        'fourier', 'spiral', 'rose', 'voronoi', 
        'matrix', 'starry'
      ];
      const style = requestedStyle || styles[Math.floor(Math.random() * styles.length)];

      if (style === 'lissajous') {
        // 1. 利萨茹激光曲线 (Lissajous Laser Curve: x = A sin(at + delta), y = B sin(bt))
        ctx.fillStyle = '#080c16';
        ctx.fillRect(0, 0, 800, 600);

        const cx = 400, cy = 300;
        const mainHue = Math.floor(Math.random() * 360);
        const aVals = [2, 3, 5, 3, 5];
        const bVals = [3, 4, 7, 5, 6];
        const comboIdx = Math.floor(Math.random() * aVals.length);
        const a = aVals[comboIdx];
        const b = bVals[comboIdx];

        ctx.shadowColor = `hsl(${mainHue}, 100%, 65%)`;
        ctx.shadowBlur = 16;
        ctx.lineWidth = 2.5;

        for (let pass = 0; pass < 3; pass++) {
          const delta = (pass * Math.PI) / 6;
          ctx.strokeStyle = `hsl(${(mainHue + pass * 40) % 360}, 100%, 65%)`;
          ctx.beginPath();
          for (let t = 0; t <= Math.PI * 2; t += 0.01) {
            const x = cx + 330 * Math.sin(a * t + delta);
            const y = cy + 230 * Math.sin(b * t);
            if (t === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
          }
          ctx.stroke();
        }
        ctx.shadowBlur = 0;
      } else if (style === 'spirograph') {
        // 2. 万花尺内/外摆线 (Hypotrochoid / Spirograph Curve)
        ctx.fillStyle = '#090d18';
        ctx.fillRect(0, 0, 800, 600);

        const cx = 400, cy = 300;
        const mainHue = Math.floor(Math.random() * 360);
        const R = 180;
        const r = [75, 105, 52, 63][Math.floor(Math.random() * 4)];
        const d = [110, 80, 130, 95][Math.floor(Math.random() * 4)];

        ctx.shadowColor = `hsl(${mainHue}, 100%, 60%)`;
        ctx.shadowBlur = 14;
        ctx.lineWidth = 1.8;

        for (let pass = 0; pass < 2; pass++) {
          ctx.strokeStyle = `hsl(${(mainHue + pass * 50) % 360}, 100%, 65%)`;
          ctx.beginPath();
          const pD = d - pass * 20;
          for (let t = 0; t <= Math.PI * 16; t += 0.02) {
            const x = cx + (R - r) * Math.cos(t) + pD * Math.cos(((R - r) / r) * t);
            const y = cy + (R - r) * Math.sin(t) - pD * Math.sin(((R - r) / r) * t);
            if (t === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
          }
          ctx.stroke();
        }
        ctx.shadowBlur = 0;
      } else if (style === 'butterfly') {
        // 3. Fay 蝴蝶曲线 (Temple Fay Butterfly Curve)
        ctx.fillStyle = '#060a14';
        ctx.fillRect(0, 0, 800, 600);

        const cx = 400, cy = 300;
        const mainHue = Math.floor(Math.random() * 360);

        ctx.shadowColor = `hsl(${mainHue}, 100%, 65%)`;
        ctx.shadowBlur = 18;
        ctx.lineWidth = 2;

        for (let pass = 0; pass < 3; pass++) {
          ctx.strokeStyle = `hsl(${(mainHue + pass * 45) % 360}, 100%, 68%)`;
          ctx.beginPath();
          const scale = 65 - pass * 8;
          for (let theta = 0; theta <= Math.PI * 12; theta += 0.02) {
            const val = Math.exp(Math.cos(theta)) - 2 * Math.cos(4 * theta) + Math.pow(Math.sin(theta / 12), 5);
            const r = scale * val;
            const x = cx + r * Math.sin(theta);
            const y = cy - r * Math.cos(theta);
            if (theta === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
          }
          ctx.stroke();
        }
        ctx.shadowBlur = 0;
      } else if (style === 'hilbert') {
        // 4. 希尔伯特空间填充曲线 (Hilbert Space-Filling Curve)
        ctx.fillStyle = '#050711';
        ctx.fillRect(0, 0, 800, 600);

        const order = 5;
        const n = Math.pow(2, order);
        const totalPoints = n * n;
        const margin = 80;
        const stepX = (800 - margin * 2) / (n - 1);
        const stepY = (600 - margin * 2) / (n - 1);

        const mainHue = Math.floor(Math.random() * 360);
        ctx.lineWidth = 2.5;

        for (let i = 0; i < totalPoints - 1; i++) {
          const [x1, y1] = d2xy(n, i);
          const [x2, y2] = d2xy(n, i + 1);

          const px1 = margin + x1 * stepX;
          const py1 = margin + y1 * stepY;
          const px2 = margin + x2 * stepX;
          const py2 = margin + y2 * stepY;

          const hue = (mainHue + (i / totalPoints) * 280) % 360;
          ctx.strokeStyle = `hsl(${hue}, 100%, 65%)`;
          ctx.beginPath();
          ctx.moveTo(px1, py1);
          ctx.lineTo(px2, py2);
          ctx.stroke();
        }
      } else if (style === 'fourier') {
        // 5. 傅里叶级数合成封闭齿轮曲线 (Fourier Series Curve)
        ctx.fillStyle = '#080c16';
        ctx.fillRect(0, 0, 800, 600);

        const cx = 400, cy = 300;
        const mainHue = Math.floor(Math.random() * 360);

        ctx.shadowColor = `hsl(${mainHue}, 100%, 65%)`;
        ctx.shadowBlur = 15;
        ctx.lineWidth = 2;

        for (let pass = 0; pass < 3; pass++) {
          ctx.strokeStyle = `hsl(${(mainHue + pass * 40) % 360}, 100%, 65%)`;
          ctx.beginPath();
          for (let t = 0; t <= Math.PI * 2; t += 0.01) {
            let x = cx;
            let y = cy;
            for (let k = 1; k <= 5; k++) {
              const radius = (180 - pass * 25) / k;
              const sign = k % 2 === 0 ? -1 : 1;
              x += radius * Math.cos(k * t * sign);
              y += radius * Math.sin(k * t * sign);
            }
            if (t === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
          }
          ctx.stroke();
        }
        ctx.shadowBlur = 0;
      } else if (style === 'spiral') {
        // 6. 黄金对数螺线 & 阿基米德螺线 (Golden Ratio & Archimedean Spiral)
        ctx.fillStyle = '#070b14';
        ctx.fillRect(0, 0, 800, 600);

        const cx = 400, cy = 300;
        const mainHue = Math.floor(Math.random() * 360);

        ctx.shadowColor = `hsl(${mainHue}, 100%, 65%)`;
        ctx.shadowBlur = 14;
        ctx.lineWidth = 2;

        for (let arms = 0; arms < 4; arms++) {
          const armAngle = (arms * Math.PI) / 2;
          ctx.strokeStyle = `hsl(${(mainHue + arms * 35) % 360}, 100%, 65%)`;
          ctx.beginPath();
          for (let theta = 0; theta <= Math.PI * 10; theta += 0.03) {
            const r = 8 * theta;
            const x = cx + r * Math.cos(theta + armAngle);
            const y = cy + r * Math.sin(theta + armAngle);
            if (theta === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
          }
          ctx.stroke();
        }
        ctx.shadowBlur = 0;
      } else if (style === 'rose') {
        // 7. 极坐标玫瑰线 (Polar Rose Curve: r = a cos(k theta))
        ctx.fillStyle = '#080c16';
        ctx.fillRect(0, 0, 800, 600);

        const cx = 400, cy = 300;
        const mainHue = Math.floor(Math.random() * 360);
        const k = [3, 4, 5, 7, 2.5][Math.floor(Math.random() * 5)];

        ctx.shadowColor = `hsl(${mainHue}, 100%, 65%)`;
        ctx.shadowBlur = 15;
        ctx.lineWidth = 2;

        for (let pass = 0; pass < 3; pass++) {
          ctx.strokeStyle = `hsl(${(mainHue + pass * 40) % 360}, 100%, 65%)`;
          ctx.beginPath();
          const radius = 230 - pass * 35;
          for (let theta = 0; theta <= Math.PI * 4; theta += 0.01) {
            const r = radius * Math.cos(k * theta);
            const x = cx + r * Math.cos(theta);
            const y = cy + r * Math.sin(theta);
            if (theta === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
          }
          ctx.stroke();
        }
        ctx.shadowBlur = 0;
      } else if (style === 'voronoi') {
        // 9. Voronoi 晶体网络 (Voronoi Crystal Diagram)
        ctx.fillStyle = '#0a0e1a';
        ctx.fillRect(0, 0, 800, 600);

        const nodes: Array<{ x: number; y: number }> = [];
        for (let i = 0; i < 28; i++) {
          nodes.push({ x: Math.random() * 800, y: Math.random() * 600 });
        }

        const mainHue = Math.floor(Math.random() * 360);

        ctx.shadowColor = `hsl(${mainHue}, 100%, 65%)`;
        ctx.shadowBlur = 10;
        ctx.lineWidth = 1;

        for (let i = 0; i < nodes.length; i++) {
          for (let j = i + 1; j < nodes.length; j++) {
            const dist = Math.hypot(nodes[i].x - nodes[j].x, nodes[i].y - nodes[j].y);
            if (dist < 160) {
              const alpha = (1 - dist / 160) * 0.7;
              ctx.strokeStyle = `hsla(${(mainHue + dist) % 360}, 100%, 65%, ${alpha})`;
              ctx.beginPath();
              ctx.moveTo(nodes[i].x, nodes[i].y);
              ctx.lineTo(nodes[j].x, nodes[j].y);
              ctx.stroke();
            }
          }
        }

        nodes.forEach(n => {
          ctx.fillStyle = `hsl(${mainHue}, 100%, 75%)`;
          ctx.beginPath(); ctx.arc(n.x, n.y, 4, 0, Math.PI * 2); ctx.fill();
        });
        ctx.shadowBlur = 0;
      } else if (style === 'starry') {
        // 10. 极光星云 (Cosmic Aurora Nebula)
        const bgGrad = ctx.createRadialGradient(400, 300, 30, 400, 300, 520);
        const starHue = Math.floor(Math.random() * 60) + 210;
        bgGrad.addColorStop(0, `hsl(${starHue}, 85%, 15%)`);
        bgGrad.addColorStop(0.6, `hsl(${(starHue + 40) % 360}, 90%, 8%)`);
        bgGrad.addColorStop(1, '#020617');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, 800, 600);

        for (let w = 0; w < 3; w++) {
          const auroraGrad = ctx.createLinearGradient(0, 100 + w * 120, 800, 300 + w * 80);
          auroraGrad.addColorStop(0, `hsla(${starHue + w * 30}, 100%, 65%, 0)`);
          auroraGrad.addColorStop(0.5, `hsla(${starHue + w * 30 + 40}, 100%, 60%, 0.25)`);
          auroraGrad.addColorStop(1, `hsla(${starHue + w * 30}, 100%, 65%, 0)`);

          ctx.fillStyle = auroraGrad;
          ctx.beginPath();
          ctx.moveTo(0, 200 + w * 100);
          ctx.bezierCurveTo(200, 100 + w * 50, 600, 400 - w * 50, 800, 250 + w * 80);
          ctx.lineTo(800, 600); ctx.lineTo(0, 600); ctx.closePath();
          ctx.fill();
        }

        ctx.fillStyle = '#ffffff';
        for (let i = 0; i < 300; i++) {
          const x = Math.random() * 800;
          const y = Math.random() * 600;
          const r = Math.random() * 1.8 + 0.2;
          ctx.globalAlpha = Math.random() * 0.85 + 0.15;
          ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
        }
        ctx.globalAlpha = 1.0;
      } else {
        // 11. 黑客帝国数字雨 (Matrix Code Rain)
        const bgGrad = ctx.createLinearGradient(0, 0, 0, 600);
        bgGrad.addColorStop(0, '#011710');
        bgGrad.addColorStop(1, '#020617');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, 800, 600);

        ctx.font = 'bold 15px monospace';
        const chars = '0123456789ABCDEFHBX%$#@*!~';
        for (let col = 0; col < 800; col += 18) {
          const len = Math.floor(Math.random() * 22) + 6;
          const startY = Math.random() * 450;
          for (let row = 0; row < len; row++) {
            const char = chars[Math.floor(Math.random() * chars.length)];
            const alpha = row === len - 1 ? 1.0 : Math.max(0.1, 1 - row / len);
            ctx.fillStyle = row === len - 1 ? '#a7f3d0' : `rgba(16, 185, 129, ${alpha})`;
            ctx.shadowColor = row === len - 1 ? '#10b981' : 'transparent';
            ctx.shadowBlur = row === len - 1 ? 10 : 0;
            ctx.fillText(char, col, startY + row * 18);
          }
        }
        ctx.shadowBlur = 0;
      }

      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const name = `math_art_${style}_${seedHex}.png`;
          resolve({ blob, url, fileName: name });
        }
      }, 'image/png');
    });
  };

  const applyPresetCover = async (requestedStyle?: string) => {
    const res = await generatePresetCoverAsync(requestedStyle);
    setIsUserUploadedCover(false);
    setCoverImage(res.blob);
    setCoverPreviewUrl(res.url);
    setCoverFileName(res.fileName);
    const cap = calculateImageCapacity(800, 600);
    setImageCapacity(cap);
    return res;
  };

  useEffect(() => {
    if (!coverImage) {
      applyPresetCover('lissajous');
    }
  }, []);

  const handleRandomPreset = () => {
    applyPresetCover();
  };

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg('');
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUserUploadedCover(true);
    setCoverImage(file);
    setCoverFileName(file.name);
    const url = URL.createObjectURL(file);
    setCoverPreviewUrl(url);

    const img = new Image();
    img.onload = () => {
      const cap = calculateImageCapacity(img.width, img.height);
      setImageCapacity(cap);
    };
    img.src = url;
  };

  const handleSecretImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg('');
    const file = e.target.files?.[0];
    if (!file) return;

    setSecretImageFile(file);
    setSecretImagePreviewUrl(URL.createObjectURL(file));
  };

  // Smart Container Polyglot Embedding Helper
  const performContainerEmbed = async (targetCoverBlob: Blob, payloadPacket: Uint8Array) => {
    const arrayBuffer = await targetCoverBlob.arrayBuffer();
    const coverBytes = new Uint8Array(arrayBuffer);
    const stegoBytes = embedImageContainer(coverBytes, payloadPacket);

    setStegoResultBytes(stegoBytes);
    const blob = new Blob([new Uint8Array(stegoBytes)], { type: (targetCoverBlob as File).type || 'image/png' });
    setStegoResultUrl(URL.createObjectURL(blob));
  };

  // Smart LSB Embedding Helper
  const performLSBEmbed = (targetCoverUrl: string, payloadPacket: Uint8Array) => {
    return new Promise<void>((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = canvasRef.current || document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas Context 错误'));
          return;
        }

        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, img.width, img.height);

        try {
          const encodedImageData = embedLSBPayload(imageData, payloadPacket, 1);
          ctx.putImageData(encodedImageData, 0, 0);

          canvas.toBlob((blob) => {
            if (blob) {
              const resultUrl = URL.createObjectURL(blob);
              setStegoResultUrl(resultUrl);
              resolve();
            } else {
              reject(new Error('Canvas 转 Blob 失败'));
            }
          }, 'image/png');
        } catch (err: any) {
          reject(err);
        }
      };
      img.onerror = () => reject(new Error('图片加载失败'));
      img.src = targetCoverUrl;
    });
  };

  // Execute Encoding (Auto Regenerates New Random Art Cover Image EVERY Single Time if not custom uploaded!)
  const handleEncode = async () => {
    setErrorMsg('');
    setStegoResultUrl(null);
    setStegoResultBytes(null);
    setUsedModeNotice(null);

    setIsProcessing(true);

    try {
      let activeCoverBlob = coverImage;
      let activeCoverUrl = coverPreviewUrl;

      if (!isUserUploadedCover || !activeCoverBlob || !activeCoverUrl) {
        const newPreset = await applyPresetCover();
        activeCoverBlob = newPreset.blob;
        activeCoverUrl = newPreset.url;
      }

      let payloadPacket: Uint8Array;
      if (payloadMode === 'text') {
        if (!secretText.trim()) {
          setErrorMsg('请设置需要隐藏的文本消息');
          setIsProcessing(false);
          return;
        }
        payloadPacket = await packPayload(secretText, PayloadType.TEXT, password);
      } else {
        if (!secretImageFile) {
          setErrorMsg('请上传需要隐藏的秘密图片');
          setIsProcessing(false);
          return;
        }
        const imgArrayBuf = await secretImageFile.arrayBuffer();
        const imgBytes = new Uint8Array(imgArrayBuf);
        payloadPacket = await packPayload(imgBytes, PayloadType.FILE, password, secretImageFile.name);
      }

      const maxLSBCapacity = imageCapacity?.maxBytesLSB1 || 180000;
      const payloadSize = payloadPacket.length;

      if (mode === 'container' || (mode === 'auto' && payloadSize > maxLSBCapacity)) {
        await performContainerEmbed(activeCoverBlob!, payloadPacket);
        if (mode === 'auto' && payloadSize > maxLSBCapacity) {
          setUsedModeNotice(`⚡ 已自动生成数学几何艺术壁纸！载荷 (${(payloadSize / 1024).toFixed(1)} KB) 超过 LSB 上限，已智能无缝升级为 Polyglot 容器隐写！`);
        } else {
          setUsedModeNotice('已自动生成数学几何艺术壁纸，并使用 Polyglot 模式完成隐写。');
        }
      } else {
        try {
          await performLSBEmbed(activeCoverUrl!, payloadPacket);
          setUsedModeNotice('已自动生成数学几何艺术壁纸，并使用 LSB 像素无痕隐写完成编码。');
        } catch (lsbErr: any) {
          await performContainerEmbed(activeCoverBlob!, payloadPacket);
          setUsedModeNotice(`⚡ 已自动生成数学几何艺术壁纸，并智能切为 Polyglot 容器模式，保证 100% 成功！`);
        }
      }
    } catch (e: any) {
      setErrorMsg(`隐写编码失败: ${e.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Execute Decoding
  const handleDecode = async () => {
    setErrorMsg('');
    setDecodedSecretText(null);
    setDecodedSecretImage(null);

    if (!stegoInputImage) {
      setErrorMsg('请选择需要提取隐藏信息的图片');
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

      if (payloadBytes) {
        await processUnpackedPayload(payloadBytes);
        setIsProcessing(false);
        return;
      }

      const imgUrl = URL.createObjectURL(stegoInputImage);
      const img = new Image();
      img.onload = async () => {
        const canvas = canvasRef.current || document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          setErrorMsg('Canvas 创建失败');
          setIsProcessing(false);
          return;
        }
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, img.width, img.height);

        try {
          payloadBytes = extractLSBPayload(imageData, 1);
          await processUnpackedPayload(payloadBytes);
        } catch (err: any) {
          setErrorMsg(`解密提取失败: 未能在图片中检测到有效隐写协议包 (${err.message})`);
        } finally {
          setIsProcessing(false);
        }
      };
      img.src = imgUrl;
    } catch (e: any) {
      setErrorMsg(`解密失败: ${e.message}`);
      setIsProcessing(false);
    }
  };

  const processUnpackedPayload = async (payloadBytes: Uint8Array) => {
    const unpacked = await unpackPayload(payloadBytes, decodePassword);
    if (unpacked.payloadText) {
      setDecodedSecretText(unpacked.payloadText);
    }
    if (unpacked.payloadFile) {
      const blob = new Blob([new Uint8Array(unpacked.payloadFile.data)]);
      const url = URL.createObjectURL(blob);
      setDecodedSecretImage({
        name: unpacked.payloadFile.name,
        url,
        sizeKB: parseFloat((unpacked.payloadFile.data.length / 1024).toFixed(1))
      });
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <canvas ref={canvasRef} className="hidden" />

      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveSubTab('encode')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center space-x-2 transition-all ${
              activeSubTab === 'encode'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>图片隐写编码 (Encode)</span>
          </button>
          <button
            onClick={() => setActiveSubTab('decode')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center space-x-2 transition-all ${
              activeSubTab === 'decode'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Unlock className="w-3.5 h-3.5" />
            <span>图片解密还原 (Decode)</span>
          </button>
        </div>

        {/* Mode Selector */}
        <div className="flex items-center space-x-2 text-xs font-mono">
          <span className="text-slate-400">隐写模式:</span>
          <button
            onClick={() => setMode('auto')}
            className={`px-3 py-1.5 rounded-lg border transition-all flex items-center space-x-1 ${
              mode === 'auto'
                ? 'bg-emerald-950 text-emerald-300 border-emerald-600 font-bold'
                : 'bg-slate-900 text-slate-400 border-slate-800'
            }`}
          >
            <Zap className="w-3 h-3 text-emerald-400" />
            <span>🤖 智能自动适应 (推荐)</span>
          </button>
          <button
            onClick={() => setMode('lsb')}
            className={`px-3 py-1.5 rounded-lg border transition-all ${
              mode === 'lsb'
                ? 'bg-blue-950 text-blue-300 border-blue-600 font-bold'
                : 'bg-slate-900 text-slate-400 border-slate-800'
            }`}
          >
            LSB 像素无痕
          </button>
          <button
            onClick={() => setMode('container')}
            className={`px-3 py-1.5 rounded-lg border transition-all ${
              mode === 'container'
                ? 'bg-purple-950 text-purple-300 border-purple-600 font-bold'
                : 'bg-slate-900 text-slate-400 border-slate-800'
            }`}
          >
            Polyglot 容器追加
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 bg-rose-950/80 border border-rose-800/80 rounded-xl text-xs text-rose-200 flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Encode Section */}
      {activeSubTab === 'encode' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Inputs */}
          <div className="bg-slate-900/80 rounded-xl border border-slate-800 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white flex items-center space-x-2">
                <ImageIcon className="w-4 h-4 text-blue-400" />
                <span>掩护图与绝密载荷设置</span>
              </h3>

              <button
                onClick={handleRandomPreset}
                className="flex items-center space-x-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-mono border border-slate-700 transition-colors"
              >
                <Shuffle className="w-3 h-3 text-blue-400" />
                <span>🎲 切换 Top-10 顶级数学曲线壁纸</span>
              </button>
            </div>

            {/* Cover Image Upload / Preset View */}
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1.5">掩护图片 (拖拽/Ctrl+V粘贴，或点击重绘全新壁纸):</label>
              <DropZoneInput
                onFileSelected={(file) => {
                  setErrorMsg('');
                  setIsUserUploadedCover(true);
                  setCoverImage(file);
                  setCoverFileName(file.name);
                  const url = URL.createObjectURL(file);
                  setCoverPreviewUrl(url);
                  const img = new Image();
                  img.onload = () => {
                    const cap = calculateImageCapacity(img.width, img.height);
                    setImageCapacity(cap);
                  };
                  img.src = url;
                }}
                previewUrl={coverPreviewUrl}
                fileName={isUserUploadedCover ? `[自定义上传] ${coverFileName}` : `[顶级数学曲线生成] ${coverFileName}`}
                placeholderText="点击、拖拽图片到此处，或按 Ctrl+V 直接粘贴图片"
                subText="✨ 支持 PNG, JPG, GIF, WebP 格式；或使用上面的按钮随时重绘动态艺术壁纸"
              />
            </div>

            {/* Payload Mode Switcher */}
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono text-slate-300 font-bold">隐藏数据类型选择:</label>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setPayloadMode('text')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                      payloadMode === 'text'
                        ? 'bg-blue-600 text-white font-bold shadow'
                        : 'bg-slate-900 text-slate-400 border border-slate-800'
                    }`}
                  >
                    隐藏文本信息
                  </button>
                  <button
                    onClick={() => setPayloadMode('image')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                      payloadMode === 'image'
                        ? 'bg-purple-600 text-white font-bold shadow'
                        : 'bg-slate-900 text-slate-400 border border-slate-800'
                    }`}
                  >
                    🖼️ 图片隐写图片 (Image-in-Image)
                  </button>
                </div>
              </div>

              {payloadMode === 'text' ? (
                <textarea
                  value={secretText}
                  onChange={(e) => setSecretText(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-mono leading-relaxed"
                  placeholder="在此输入要隐藏到图片里的秘密消息..."
                />
              ) : (
                <div className="space-y-2">
                  <label className="block text-xs font-mono text-slate-400">隐藏秘密图片 (拖拽/Ctrl+V粘贴/点击):</label>
                  <DropZoneInput
                    compact
                    onFileSelected={(file) => {
                      setErrorMsg('');
                      setSecretImageFile(file);
                      setSecretImagePreviewUrl(URL.createObjectURL(file));
                    }}
                    previewUrl={secretImagePreviewUrl}
                    fileName={secretImageFile?.name}
                    fileSizeKB={secretImageFile ? parseFloat((secretImageFile.size / 1024).toFixed(1)) : undefined}
                    placeholderText="点击、拖拽秘密图片，或 Ctrl+V 粘贴"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1.5">AES-256-GCM 加密口令 (可选密码锁):</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
                placeholder="密码留空表示不附加加密..."
              />
            </div>

            <button
              onClick={handleEncode}
              disabled={isProcessing}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center space-x-2"
            >
              <Sparkles className="w-4 h-4 text-blue-200" />
              <span>{isProcessing ? '正在生成全新壁纸与编码中...' : '生成 HiddenBox 隐写图像 (重绘全新壁纸)'}</span>
            </button>
          </div>

          {/* Right Output */}
          <div className="bg-slate-900/80 rounded-xl border border-slate-800 p-5 space-y-4 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white mb-3">生成的隐写图像 (已重绘全新顶级数学壁纸)</h3>
              {stegoResultUrl ? (
                <div className="space-y-4">
                  <div className="relative border border-slate-800 rounded-xl overflow-hidden bg-slate-950 flex items-center justify-center p-2 max-h-[300px]">
                    <img src={stegoResultUrl} alt="Stego Result" className="max-h-[280px] object-contain rounded" />
                    <div className="absolute top-2 right-2 px-2 py-1 bg-emerald-950/90 border border-emerald-800 text-emerald-300 text-[10px] font-mono rounded font-bold">
                      隐写成功
                    </div>
                  </div>
                  <a
                    href={stegoResultUrl}
                    download={`stego_${coverFileName}`}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center space-x-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>下载隐写后的图片 (PNG/无损)</span>
                  </a>
                </div>
              ) : (
                <div className="h-[260px] border border-slate-800/80 rounded-xl bg-slate-950 flex items-center justify-center text-slate-600 text-xs italic">
                  在左侧配置后点击生成隐写图片...
                </div>
              )}
            </div>

            {usedModeNotice && (
              <div className="p-3 bg-emerald-950/60 border border-emerald-800 rounded-lg text-[11px] text-emerald-300 font-mono">
                {usedModeNotice}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Decode Section */}
      {activeSubTab === 'decode' && (
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="bg-slate-900/80 rounded-xl border border-slate-800 p-6 space-y-4">
            <h3 className="text-sm font-semibold text-white flex items-center space-x-2">
              <Unlock className="w-4 h-4 text-emerald-400" />
              <span>解密提取隐藏的图片或文本</span>
            </h3>

            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1.5">选择或粘贴隐写图片 (支持 Ctrl+V / 拖拽):</label>
              <DropZoneInput
                onFileSelected={(file) => {
                  setErrorMsg('');
                  setStegoInputImage(file);
                }}
                previewUrl={stegoInputImage ? URL.createObjectURL(stegoInputImage) : null}
                fileName={stegoInputImage?.name}
                fileSizeKB={stegoInputImage ? parseFloat((stegoInputImage.size / 1024).toFixed(1)) : undefined}
                placeholderText="点击、拖拽隐写图片到此处，或直接按 Ctrl+V 粘贴"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1.5">解密密码 (如设置了 AES 口令):</label>
              <input
                type="password"
                value={decodePassword}
                onChange={(e) => setDecodePassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
                placeholder="无密码请留空..."
              />
            </div>

            <button
              onClick={handleDecode}
              disabled={isProcessing}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-lg shadow-emerald-600/30 transition-all"
            >
              {isProcessing ? '正在提取算法分析中...' : '解密还原秘密数据/图片'}
            </button>
          </div>

          {/* Text Result */}
          {decodedSecretText && (
            <div className="bg-slate-900/90 rounded-xl border border-emerald-800 p-6 space-y-3 glow-emerald">
              <span className="text-xs font-mono font-bold text-emerald-400">解密提取成功文本 Payload:</span>
              <div className="p-4 bg-slate-950 rounded-lg font-mono text-xs text-emerald-300 leading-relaxed whitespace-pre-wrap select-all">
                {decodedSecretText}
              </div>
            </div>
          )}

          {/* Extracted Secret Image Result */}
          {decodedSecretImage && (
            <div className="bg-slate-900/90 rounded-xl border border-purple-800/80 p-6 space-y-4 animate-fadeIn shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-mono font-bold text-purple-400 flex items-center space-x-2">
                  <FileImage className="w-4 h-4 text-purple-400" />
                  <span>🎉 成功解密提取出隐藏的秘密图片档案！</span>
                </span>
                <span className="text-xs font-mono text-slate-400">大小: {decodedSecretImage.sizeKB} KB</span>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex justify-center max-h-[350px]">
                <img src={decodedSecretImage.url} alt="Extracted Secret Image" className="max-h-[330px] object-contain rounded border border-purple-900/50 shadow-lg" />
              </div>

              <a
                href={decodedSecretImage.url}
                download={decodedSecretImage.name || 'extracted_secret_image.png'}
                className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold shadow-lg shadow-purple-600/30 transition-all flex items-center justify-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>下载解密出来的秘密图片文件 ({decodedSecretImage.name})</span>
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
