import React from 'react';
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
    loadTrackFromDb,
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

  const handlePlayPause = async () => {
    if (isPlaying) {
      pause();
      return;
    }
    // Reload from DB if engine lost its buffer (e.g. page reload)
    if (!fileInfo && currentTrack) {
      const loaded = await loadTrackFromDb(currentTrack.id);
      if (loaded) play();
    } else {
      play();
    }
  };

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

  const progressPct = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 w-full bg-black/95 backdrop-blur-xl border-t border-white/10">

      {/* Progress bar — full width, clickable */}
      <div
        className="w-full h-1 bg-white/10 cursor-pointer group"
        onClick={handleScrub}
        role="progressbar"
        aria-valuenow={currentTime}
        aria-valuemax={duration}
        aria-label="Seek track"
      >
        <div
          className="h-full bg-accent group-hover:brightness-110 transition-all duration-[50ms]"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* ── MOBILE LAYOUT ── */}
      <div className="md:hidden flex flex-col px-5 pt-3 pb-4 gap-3">
        {/* Track info */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 bg-white/5 rounded-md flex items-center justify-center flex-shrink-0">
            <Music className="w-4 h-4 text-white/30" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-white text-sm font-semibold truncate leading-tight">
              {currentTrack?.name || "No track selected"}
            </span>
            <span className="text-white/40 text-[11px] truncate">Peak Studio</span>
          </div>
        </div>

        {/* Controls row */}
        <div className="flex items-center justify-between px-2">
          <button
            onClick={toggleShuffle}
            className={clsx("p-2 cursor-pointer transition-colors", isShuffling ? "text-accent" : "text-white/40 hover:text-white")}
            aria-label="Shuffle"
          >
            <Shuffle className="w-5 h-5" />
          </button>

          <button
            onClick={handlePrev}
            className="p-2 text-white/70 hover:text-white transition-colors cursor-pointer"
            aria-label="Previous track"
          >
            <SkipBack className="w-6 h-6 fill-current" />
          </button>

          {/* BIG play button */}
          <button
            onClick={handlePlayPause}
            disabled={!currentTrack}
            className="w-14 h-14 flex items-center justify-center bg-accent hover:bg-accent-hover text-white rounded-full transition-all active:scale-95 disabled:opacity-40 shadow-[0_0_20px_rgba(255,45,85,0.4)] cursor-pointer"
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <Pause className="w-6 h-6 fill-current" />
            ) : (
              <Play className="w-6 h-6 fill-current ml-0.5" />
            )}
          </button>

          <button
            onClick={handleNext}
            className="p-2 text-white/70 hover:text-white transition-colors cursor-pointer"
            aria-label="Next track"
          >
            <SkipForward className="w-6 h-6 fill-current" />
          </button>

          <button
            onClick={toggleRepeat}
            className={clsx("p-2 cursor-pointer transition-colors", repeatMode !== 'off' ? "text-accent" : "text-white/40 hover:text-white")}
            aria-label="Repeat"
          >
            {repeatMode === 'one' ? <Repeat1 className="w-5 h-5" /> : <Repeat className="w-5 h-5" />}
          </button>
        </div>

        {/* Time row */}
        <div className="flex justify-between text-[10px] text-white/30 font-mono tabular-nums px-1">
          <span>{formatTime(currentTime)}</span>
          <span>{duration ? formatTime(duration) : "0:00"}</span>
        </div>
      </div>

      {/* ── DESKTOP LAYOUT ── */}
      <div className="hidden md:flex items-center px-4 h-24 gap-4">

        {/* Left: Track Info */}
        <div className="flex items-center gap-3 min-w-0 w-[30%]">
          <div className="w-14 h-14 bg-white/5 rounded-md flex items-center justify-center flex-shrink-0">
            <Music className="w-6 h-6 text-white/20" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-white text-sm font-medium truncate">{currentTrack?.name || "No track selected"}</span>
            <span className="text-white/50 text-xs truncate">Peak Studio</span>
          </div>
        </div>

        {/* Center: Controls + Scrubber */}
        <div className="flex-1 flex flex-col items-center gap-2 max-w-2xl mx-auto">
          <div className="flex items-center gap-6">
            <button onClick={toggleShuffle} className={clsx("cursor-pointer transition-colors", isShuffling ? "text-accent" : "text-white/50 hover:text-white")} aria-label="Shuffle">
              <Shuffle className="w-4 h-4" />
            </button>
            <button onClick={handlePrev} className="text-white/70 hover:text-white transition-colors cursor-pointer" aria-label="Previous">
              <SkipBack className="w-5 h-5 fill-current" />
            </button>
            <button
              onClick={handlePlayPause}
              disabled={!currentTrack}
              className="w-9 h-9 flex items-center justify-center bg-white text-black rounded-full hover:scale-105 transition-transform disabled:opacity-50 cursor-pointer"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
            </button>
            <button onClick={handleNext} className="text-white/70 hover:text-white transition-colors cursor-pointer" aria-label="Next">
              <SkipForward className="w-5 h-5 fill-current" />
            </button>
            <button onClick={toggleRepeat} className={clsx("cursor-pointer transition-colors", repeatMode !== 'off' ? "text-accent" : "text-white/50 hover:text-white")} aria-label="Repeat">
              {repeatMode === 'one' ? <Repeat1 className="w-4 h-4" /> : <Repeat className="w-4 h-4" />}
            </button>
          </div>

          <div className="flex w-full items-center gap-3 px-2">
            <span className="text-[11px] text-white/50 font-mono tabular-nums">{formatTime(currentTime)}</span>
            <div className="flex-1 h-1 bg-white/10 rounded-full cursor-pointer group relative overflow-hidden" onClick={handleScrub}>
              <div className="h-full bg-white group-hover:bg-accent transition-all duration-[50ms]" style={{ width: `${progressPct}%` }} />
            </div>
            <span className="text-[11px] text-white/50 font-mono tabular-nums">{duration ? formatTime(duration) : "0:00"}</span>
          </div>
        </div>

        {/* Right: Volume */}
        <div className="w-[30%] flex justify-end items-center gap-4">
          <Volume2 className="w-4 h-4 text-white/50" />
        </div>
      </div>

    </div>
  );
}