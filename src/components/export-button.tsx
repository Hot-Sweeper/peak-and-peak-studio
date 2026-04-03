"use client";

import { Download, Loader2 } from "lucide-react";
import { useAudioStore } from "@/stores/audio-store";

export function ExportButton() {
  const fileInfo = useAudioStore((s) => s.fileInfo);
  const isExporting = useAudioStore((s) => s.isExporting);
  const exportAudio = useAudioStore((s) => s.exportAudio);

  if (!fileInfo) return null;

  return (
    <button
      onClick={exportAudio}
      disabled={isExporting}
      className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-3xl bg-white/5 hover:bg-white/10 active:scale-[0.98] border border-white/10 text-white font-semibold shadow-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
      aria-label={isExporting ? "Exporting audio..." : "Export audio as WAV"}
    >
      {isExporting ? (
        <Loader2 className="w-5 h-5 text-accent animate-spin" aria-hidden="true" />
      ) : (
        <Download className="w-5 h-5 text-accent/80 group-hover:text-accent transition-colors" aria-hidden="true" />
      )}
      {isExporting ? "Rendering track..." : "Export Master"}
    </button>
  );
}
