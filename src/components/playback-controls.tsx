"use client";

import { Play, Pause, RotateCcw, SkipBack } from "lucide-react";
import { useAudioStore } from "@/stores/audio-store";

export function PlaybackControls() {
  const playbackState = useAudioStore((s) => s.playbackState);
  const currentTime = useAudioStore((s) => s.currentTime);
  const fileInfo = useAudioStore((s) => s.fileInfo);
  const play = useAudioStore((s) => s.play);
  const pause = useAudioStore((s) => s.pause);
  const stop = useAudioStore((s) => s.stop);
  const seek = useAudioStore((s) => s.seek);
  const resetConfig = useAudioStore((s) => s.resetConfig);

  if (!fileInfo) return null;

  const duration = fileInfo.duration;

  const handleScrub = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    seek(percent * duration);
  };

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Scrubber / Progress Bar */}
      <div className="w-full">
        <div
          className="w-full h-[6px] rounded-full bg-white/10 overflow-hidden cursor-pointer group relative"
          onClick={handleScrub}
          role="progressbar"
          aria-valuenow={Math.round(currentTime)}
          aria-valuemin={0}
          aria-valuemax={Math.round(duration)}
          aria-label="Playback progress"
        >
          <div
            className="h-full bg-white group-hover:bg-accent rounded-full transition-all duration-[50ms] ease-out pointer-events-none"
            style={{ width: `${Math.min((currentTime / duration) * 100, 100)}%` }}
          />
        </div>
        <div className="flex justify-between items-center mt-2 px-1">
          <span className="text-white/50 text-[11px] font-mono tabular-nums leading-none tracking-wide">
            {formatTime(currentTime)}
          </span>
          <span className="text-white/50 text-[11px] font-mono tabular-nums leading-none tracking-wide">
            -{formatTime(duration - currentTime)}
          </span>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex items-center justify-center gap-10">
        <button
          onClick={stop}
          aria-label="Restart track"
          className="text-white/70 hover:text-white transition-colors"
        >
          <SkipBack className="w-8 h-8" strokeWidth={1.5} fill="currentColor" />
        </button>

        <button
          onClick={playbackState === "playing" ? pause : play}
          aria-label={playbackState === "playing" ? "Pause" : "Play"}
          className="w-20 h-20 bg-accent hover:bg-accent-hover active:scale-95 text-white rounded-full flex items-center justify-center shadow-glow transition-all"
        >
          {playbackState === "playing" ? (
            <Pause className="w-9 h-9" strokeWidth={0} fill="currentColor" aria-hidden="true" />
          ) : (
            <Play className="w-9 h-9 ml-1" strokeWidth={0} fill="currentColor" aria-hidden="true" />
          )}
        </button>

        <button
          onClick={resetConfig}
          aria-label="Reset all effects"
          className="text-white/70 hover:text-white transition-colors"
        >
          <RotateCcw className="w-6 h-6" strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
