import React, { useEffect, useRef } from 'react';
import { useAudioStore } from '@/stores/audio-store';
import { useLibraryStore } from '@/stores/library-store';
import { Play, Pause, SkipBack, SkipForward, Repeat, Repeat1, Shuffle, Volume2, Music } from 'lucide-react';
import clsx from 'clsx';

export function BottomPlayer() {
  const {
    playbackState,
    currentTime,
    fileInfo,
    play,
    pause,
    seek,
    config,
    setConfig,
    loadTrackFromDb
  } = useAudioStore();

  const {
    getCurrentTrackMeta,
    repeatMode,
    isShuffling,
    toggleRepeat,
    toggleShuffle,
    nextTrack,
    prevTrack,
  } = useLibraryStore();

  const currentTrack = getCurrentTrackMeta();
  const duration = fileInfo?.duration || 0;
  const isPlaying = playbackState === "playing";

  const handleNext = async () => {
    const nextId = nextTrack();
    if (nextId) {
      const loaded = await loadTrackFromDb(nextId);
      if (loaded) play();
    } else {
      seek(0);
      pause();
    }
  };

  const handlePrev = async () => {
    if (currentTime > 3) {
      seek(0);
    } else {
      const prevId = prevTrack();
      if (prevId) {
        const loaded = await loadTrackFromDb(prevId);
        if (loaded) play();
      } else {
        seek(0);
      }
    }
  };

  const handleScrub = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    seek(percent * duration);
  };

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="h-[90px] md:h-24 bg-black/90 backdrop-blur-xl border-t border-white/10 flex flex-col md:flex-row items-center px-4 w-full z-50 fixed bottom-0">
      
      {/* Absolute Mobile Scrubber */}
      <div className="absolute top-0 left-0 right-0 w-full h-[2px] md:hidden bg-white/10 cursor-pointer" onClick={handleScrub}>
        <div 
          className="h-full bg-accent" 
          style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }} 
        />
      </div>

      <div className="w-full flex items-center justify-between h-full pt-1 md:pt-0">
        
        {/* Left: Track Info */}
        <div className="flex-1 flex items-center gap-3 min-w-0 md:max-w-[30%]">
          <div className="w-10 h-10 md:w-14 md:h-14 bg-white/5 rounded-md flex items-center justify-center overflow-hidden flex-shrink-0">
            <Music className="w-5 h-5 md:w-6 md:h-6 text-white/20" />
          </div>
          <div className="flex flex-col truncate pr-2">
            <span className="text-white text-[13px] md:text-sm font-medium truncate">
              {currentTrack?.name || "No track selected"}
            </span>
            <span className="text-white/50 text-[11px] md:text-xs truncate">Peak Studio</span>
          </div>
        </div>

        {/* Center: Controls & Scrubber (Desktop) / Mobile Right Controls */}
        <div className="flex-1 md:max-w-2xl flex flex-row md:flex-col items-center justify-end md:justify-center gap-2">
          <div className="flex items-center justify-end md:justify-center gap-4 md:gap-6">
            <button onClick={toggleShuffle} className={clsx("hidden md:block text-white transition-colors cursor-pointer", isShuffling ? "text-accent" : "text-white/50 hover:text-white")}>
              <Shuffle className="w-4 h-4" />
            </button>
            
            <button onClick={handlePrev} className="hidden md:block text-white/70 hover:text-white transition-colors cursor-pointer">
              <SkipBack className="w-5 h-5 fill-current" />
            </button>
            
            <button
              onClick={isPlaying ? pause : play}
              disabled={!currentTrack}
              className="w-10 h-10 md:w-8 md:h-8 flex items-center justify-center bg-white text-black rounded-full hover:scale-105 transition-transform disabled:opacity-50 cursor-pointer"
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 fill-current" />
              ) : (
                <Play className="w-4 h-4 fill-current ml-0.5" />
              )}
            </button>
            
            <button onClick={handleNext} className="text-white/80 hover:text-white transition-colors ml-1 md:ml-0 cursor-pointer">
              <SkipForward className="w-5 h-5 md:w-5 md:h-5 fill-current" />
            </button>
            
            <button onClick={toggleRepeat} className={clsx("hidden md:block text-white transition-colors cursor-pointer", repeatMode !== 'off' ? "text-accent" : "text-white/50 hover:text-white")}>
              {repeatMode === 'one' ? <Repeat1 className="w-4 h-4" /> : <Repeat className="w-4 h-4" />}
            </button>
          </div>

          {/* Desktop Scrubber */}
          <div className="hidden md:flex w-full items-center gap-3 px-2">
            <span className="text-[11px] text-white/50 font-mono tabular-nums leading-none">
              {formatTime(currentTime)}
            </span>
            <div
              className="flex-1 h-1 bg-white/10 rounded-full cursor-pointer group relative overflow-hidden"
              onClick={handleScrub}
            >
              <div
                className="h-full bg-white group-hover:bg-accent transition-all duration-[50ms]"
                style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
              />
            </div>
            <span className="text-[11px] text-white/50 font-mono tabular-nums leading-none">
              {duration ? formatTime(duration) : "0:00"}
            </span>
          </div>
        </div>

        {/* Right: Volume / Extras */}
        <div className="flex-1 justify-end items-center gap-4 hidden md:flex min-w-0 max-w-[30%]">
          <Volume2 className="w-4 h-4 text-white/50" />
        </div>

      </div>
    </div>
  );
}