"use client";

import { useCallback, useRef, useState } from "react";
import { Upload } from "lucide-react";
import { useAudioStore } from "@/stores/audio-store";

export function UploadZone() {
  const loadFile = useAudioStore((s) => s.loadFile);
  const fileInfo = useAudioStore((s) => s.fileInfo);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const ACCEPTED_TYPES = [
    "audio/mpeg",
    "audio/wav",
    "audio/ogg",
    "audio/flac",
    "audio/aac",
    "audio/webm",
    "audio/mp4",
  ];

  const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

  const handleFile = useCallback(
    async (file: File) => {
      if (!ACCEPTED_TYPES.includes(file.type) && !file.name.match(/\.(mp3|wav|ogg|flac|aac|webm|m4a)$/i)) {
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        return;
      }
      await loadFile(file);
    },
    [loadFile]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const onDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const onChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  if (fileInfo) {
    return (
      <div className="glass-panel p-4 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-text-primary font-medium truncate">{fileInfo.name}</p>
          <p className="text-text-secondary text-sm">
            {formatDuration(fileInfo.duration)} &middot;{" "}
            {(fileInfo.sampleRate / 1000).toFixed(1)}kHz &middot;{" "}
            {fileInfo.numberOfChannels === 1 ? "Mono" : "Stereo"}
          </p>
        </div>
        <button
          onClick={() => inputRef.current?.click()}
          className="shrink-0 px-4 py-2 rounded-[var(--radius-glass)] bg-bg-glass border border-border-glass text-text-secondary text-sm hover:bg-bg-glass-hover hover:text-text-primary transition-all duration-[var(--transition-fast)]"
          aria-label="Replace audio file"
        >
          Replace
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="audio/*"
          onChange={onChange}
          className="hidden"
          aria-hidden="true"
        />
      </div>
    );
  }

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Upload audio file. Drop a file or click to browse."
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          inputRef.current?.click();
        }
      }}
      className={`glass-panel p-12 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all duration-[var(--transition-base)] ${
        isDragOver
          ? "border-accent bg-accent-glow scale-[1.01]"
          : "hover:border-border-glass-hover"
      }`}
    >
      <div className="w-14 h-14 rounded-full bg-bg-glass flex items-center justify-center">
        <Upload className="w-6 h-6 text-accent" aria-hidden="true" />
      </div>
      <div className="text-center">
        <p className="text-text-primary font-medium">Drop your audio file here</p>
        <p className="text-text-secondary text-sm mt-1">
          MP3, WAV, OGG, FLAC, AAC — up to 50MB
        </p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="audio/*"
        onChange={onChange}
        className="hidden"
        aria-hidden="true"
      />
    </div>
  );
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
