"use client";

import { useCallback, useRef, useState } from "react";
import { Upload } from "lucide-react";
import { useAudioStore } from "@/stores/audio-store";
import { AUDIO_FILE_ACCEPT, isAudioFile } from "@/lib/audio/file-types";

export function UploadZone() {
  const loadFile = useAudioStore((s) => s.loadFile);
  const fileInfo = useAudioStore((s) => s.fileInfo);
  const inputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);
      if (!isAudioFile(file)) {
        setError("Please select an audio file (MP3, WAV, FLAC, AAC, OGG, M4A).");
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        setError("File is too large. Maximum size is 50 MB.");
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
      // Reset so the same file can be re-selected
      e.target.value = "";
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
        {/* Replace button: uses label so iOS directly activates the input */}
        <label
          className="relative shrink-0 px-4 py-2 rounded-[var(--radius-glass)] bg-bg-glass border border-border-glass text-text-secondary text-sm hover:bg-bg-glass-hover hover:text-text-primary transition-all duration-[var(--transition-fast)] cursor-pointer select-none"
          aria-label="Replace audio file"
        >
          Replace
          <input
            ref={replaceInputRef}
            type="file"
            accept={AUDIO_FILE_ACCEPT}
            onChange={onChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            tabIndex={-1}
          />
        </label>
      </div>
    );
  }

  return (
    <label
      aria-label="Upload audio file. Drop a file or click to browse."
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      className={`relative glass-panel p-12 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all duration-[var(--transition-base)] ${
        isDragOver
          ? "border-accent bg-accent-glow scale-[1.01]"
          : "hover:border-border-glass-hover"
      }`}
    >
      <div className="w-14 h-14 rounded-full bg-bg-glass flex items-center justify-center pointer-events-none">
        <Upload className="w-6 h-6 text-accent" aria-hidden="true" />
      </div>
      <div className="text-center pointer-events-none">
        <p className="text-text-primary font-medium">Drop your audio file here</p>
        <p className="text-text-secondary text-sm mt-1">
          MP3, WAV, OGG, FLAC, AAC — up to 50MB
        </p>
        {error && (
          <p className="text-red-400 text-sm mt-2" role="alert">{error}</p>
        )}
      </div>
      {/*
        Input covers the full label area and is transparent.
        iOS Safari correctly activates real file inputs that are directly tapped —
        display:none or visibility:hidden triggers a webkit bug that grays out files.
      */}
      <input
        ref={inputRef}
        type="file"
        accept={AUDIO_FILE_ACCEPT}
        onChange={onChange}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        tabIndex={-1}
        aria-hidden="true"
      />
    </label>
  );
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
