import React, { useRef } from 'react';
import { useLibraryStore } from '@/stores/library-store';
import { useAudioStore } from '@/stores/audio-store';
import { Play, Clock, Hash, MoreHorizontal } from 'lucide-react';
import clsx from 'clsx';
import { TrackMeta } from '@/lib/db/client';

export function TrackList({ tracks }: { tracks: TrackMeta[] }) {
  const { playTrack, getCurrentTrackMeta } = useLibraryStore();
  const { play, loadTrackFromDb, playbackState, fileInfo } = useAudioStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadFiles } = useLibraryStore();
  const currentTrack = getCurrentTrackMeta();

  const handlePlay = async (index: number, trackId: string) => {
    if (currentTrack?.id === trackId && playbackState !== 'playing') {
      // Engine loses its buffer on page reload — reload from DB if needed
      if (!fileInfo) {
        const loaded = await loadTrackFromDb(trackId);
        if (loaded) play();
      } else {
        play();
      }
      return;
    }
    
    // Set the queue context to the current list
    playTrack(trackId, tracks.map(t => t.id));
    const loaded = await loadTrackFromDb(trackId);
    if (loaded) play();
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const files = Array.from(e.target.files);
    await uploadFiles(files);
  };

  const formatSize = (bytes: number) => {
    return (bytes / 1024 / 1024).toFixed(1) + ' MB';
  };

  return (
    <div className="flex-1 w-full max-w-5xl mx-auto flex flex-col pt-4 md:pt-8 px-4 lg:px-12 pb-32">
      <div className="flex items-end justify-between mb-6 md:mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-1 md:mb-2">Local Files</h1>
          <p className="text-white/50 text-xs md:text-sm">{tracks.length} tracks</p>
        </div>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="bg-accent hover:bg-accent-hover text-white font-bold py-2 md:py-3 px-6 md:px-8 rounded-full transition-transform active:scale-95 shadow-glow text-sm md:text-base flex-shrink-0 cursor-pointer"
        >
          Add Files
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          multiple
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>

      {tracks.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center mt-20 opacity-50">
          <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mb-6">
            <Play className="w-10 h-10 ml-2" />
          </div>
          <h3 className="text-xl font-medium text-white mb-2">No tracks yet</h3>
          <p className="text-sm max-w-sm">
            Add some local audio files to get started with your slowed & reverb studio.
            Files stay in your browser and are never uploaded to a server.
          </p>
        </div>
      ) : (
        <div className="w-full">
          {/* Header */}
          <div className="grid grid-cols-[auto_1fr_auto] md:grid-cols-[auto_1fr_auto_auto] gap-3 md:gap-4 px-2 md:px-4 py-2 text-[10px] md:text-xs font-medium uppercase tracking-wider text-white/50 border-b border-white/10 mb-4 sticky top-0 bg-black/80 backdrop-blur-md z-10">
            <div className="w-6 md:w-8 flex justify-center"><Hash className="w-3 h-3 md:w-4 md:h-4" /></div>
            <div>Title</div>
            <div className="hidden md:block w-24 px-2">Size</div>
            <div className="w-10 md:w-12 flex justify-end md:justify-center pr-2 md:pr-0"><Clock className="w-3 h-3 md:w-4 md:h-4" /></div>
          </div>

          {/* Tracks */}
          <div className="flex flex-col gap-1">
            {tracks.map((track, i) => {
              const isCurrent = currentTrack?.id === track.id;
              
              return (
                <div
                  key={track.id}
                  onClick={() => handlePlay(i, track.id)}
                  className="group grid grid-cols-[auto_1fr_auto] md:grid-cols-[auto_1fr_auto_auto] items-center gap-3 md:gap-4 px-2 md:px-4 py-3 md:py-3 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <div className="w-6 md:w-8 flex justify-center text-white/50 relative text-sm items-center h-5">
                    <span className={clsx("group-hover:opacity-0", isCurrent && "text-accent")}>
                      {isCurrent ? (
                        playbackState === 'playing' ? (
                          <div className="flex items-end justify-center w-4 h-4 gap-[2px]">
                            <div className="w-[3px] bg-accent rounded-sm animate-eq" style={{ animationDuration: '0.9s' }} />
                            <div className="w-[3px] bg-accent rounded-sm animate-eq" style={{ animationDuration: '1.2s', animationDelay: '0.2s', height: '100%' }} />
                            <div className="w-[3px] bg-accent rounded-sm animate-eq" style={{ animationDuration: '1.0s', animationDelay: '0.4s', height: '80%' }} />
                          </div>
                        ) : (
                          <div className="flex items-end justify-center w-4 h-4 gap-[2px] pb-[2px]">
                            <div className="w-[3px] bg-accent rounded-sm h-[3px]" />
                            <div className="w-[3px] bg-accent rounded-sm h-[3px]" />
                            <div className="w-[3px] bg-accent rounded-sm h-[3px]" />
                          </div>
                        )
                      ) : (
                        i + 1
                      )}
                    </span>
                      <button className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer">                        <Play className="w-3 h-3 md:w-4 md:h-4 fill-white text-white" />                    </button>
                  </div>
                  
                  <div className="flex flex-col min-w-0">
                    <span className={clsx("truncate font-medium text-sm md:text-base", isCurrent ? "text-accent" : "text-white")}>
                      {track.name}
                    </span>
                  </div>

                  <div className="hidden md:block w-24 px-2 text-sm text-white/50 tabular-nums">
                    {formatSize(track.size)}
                  </div>

                  <div className="w-10 md:w-12 flex justify-end md:justify-center pr-2 md:pr-0 text-white/50 hover:text-white">
                    <button onClick={(e) => { e.stopPropagation(); }} className="opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                      <MoreHorizontal className="w-4 h-4 md:w-5 md:h-5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}