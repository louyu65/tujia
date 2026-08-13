import React, { useState, useEffect, useRef } from 'react';
import { Upload, FileImage } from 'lucide-react';

interface DropZoneInputProps {
  onFileSelected: (file: File) => void;
  onFilesSelected?: (files: FileList) => void;
  multiple?: boolean;
  accept?: string;
  className?: string;
  previewUrl?: string | null;
  fileName?: string;
  fileSizeKB?: number;
  placeholderText?: string;
  subText?: string;
  compact?: boolean;
}

export const DropZoneInput: React.FC<DropZoneInputProps> = ({
  onFileSelected,
  onFilesSelected,
  multiple = false,
  accept = 'image/*',
  className = '',
  previewUrl,
  fileName,
  fileSizeKB,
  placeholderText = '点击上传，或拖拽 / Ctrl+V 粘贴图片',
  subText = '支持 PNG, JPG, GIF, WebP 格式',
  compact = false
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Clipboard Paste Event Handler (Ctrl+V)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      // Only process paste if this dropzone or page is active/focused
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            e.preventDefault();
            onFileSelected(file);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => {
      window.removeEventListener('paste', handlePaste);
    };
  }, [onFileSelected]);

  // Drag & Drop Handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      if (multiple && onFilesSelected) {
        onFilesSelected(files);
      } else {
        const firstImg = Array.from(files).find(f => f.type.startsWith('image/')) || files[0];
        onFileSelected(firstImg);
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    if (multiple && onFilesSelected) {
      onFilesSelected(files);
    } else {
      onFileSelected(files[0]);
    }
  };

  if (compact) {
    return (
      <div
        ref={containerRef}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative border border-dashed rounded-lg p-2.5 text-center transition-all cursor-pointer ${
          isDragOver
            ? 'border-purple-400 bg-purple-950/60 ring-2 ring-purple-500/50'
            : 'border-purple-800/80 bg-purple-950/20 hover:bg-purple-950/40'
        } ${className}`}
      >
        <input
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleInputChange}
          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
        />
        {previewUrl ? (
          <div className="flex items-center space-x-3">
            <img src={previewUrl} alt="Preview" className="w-10 h-10 object-cover rounded border border-purple-600" />
            <div className="text-left text-xs font-mono truncate">
              <p className="text-purple-200 font-bold truncate">{fileName || '已选择图片'}</p>
              {fileSizeKB !== undefined && <p className="text-slate-400">{fileSizeKB} KB</p>}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center space-x-2 py-1 text-purple-300 text-xs font-mono">
            <FileImage className="w-4 h-4 text-purple-400" />
            <span>{placeholderText}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative border-2 border-dashed rounded-xl p-4 text-center transition-all cursor-pointer ${
        isDragOver
          ? 'border-blue-400 bg-blue-950/70 ring-4 ring-blue-500/30 scale-[1.01]'
          : 'border-slate-800 hover:border-blue-500/50 bg-slate-950/60 hover:bg-slate-900/60'
      } ${className}`}
    >
      <input
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleInputChange}
        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
      />

      {previewUrl ? (
        <div className="flex items-center space-x-4">
          <img src={previewUrl} alt="Preview" className="w-20 h-20 object-cover rounded-lg border border-slate-700 shadow" />
          <div className="text-left text-xs font-mono space-y-1">
            <p className="font-semibold text-white truncate max-w-[240px]">{fileName || '已加载图片'}</p>
            {fileSizeKB !== undefined && <p className="text-slate-400">大小: {fileSizeKB} KB</p>}
            <p className="text-emerald-400 text-[11px]">✨ 已成功载入 (支持拖拽 / Ctrl+V 更换图片)</p>
          </div>
        </div>
      ) : (
        <div className="space-y-2 py-3">
          <Upload className={`w-8 h-8 mx-auto transition-transform ${isDragOver ? 'text-blue-400 scale-110 animate-bounce' : 'text-slate-500'}`} />
          <p className="text-xs text-slate-300 font-bold">{placeholderText}</p>
          <p className="text-[11px] text-slate-500 font-mono">{subText}</p>
        </div>
      )}
    </div>
  );
};
