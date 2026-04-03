"use client";

import { useEffect, useState } from "react";
import { useLibraryStore } from "@/stores/library-store";
import { Sidebar } from "@/components/layout/sidebar";
import { BottomPlayer } from "@/components/layout/bottom-player";
import { TrackList } from "@/components/library/track-list";
import { EffectControls } from "@/components/effect-controls";
import { useAudioStore } from "@/stores/audio-store";
import clsx from "clsx";
import { Download } from "lucide-react";

export default function Home() {
  const { init, tracks, isLoading } = useLibraryStore();
  const { isExporting, exportAudio } = useAudioStore();
  const [mobileTab, setMobileTab] = useState<'library' | 'effects'>('library');

  useEffect(() => {
    init();
  }, [init]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-accent border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-black text-white overflow-hidden relative">
      <Sidebar />
      
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden relative bg-gradient-to-br from-black to-white/5">
        
        {/* Mobile Tab Switcher */}
        <div className="lg:hidden flex p-4 shrink-0 z-30 bg-black/80 backdrop-blur-md border-b border-white/5 w-full">
          <div className="flex w-full bg-white/5 p-1 rounded-full cursor-pointer">
            <button 
              onClick={() => setMobileTab('library')}
              className={clsx(
                "flex-1 py-2 text-center font-bold text-sm rounded-full transition-colors cursor-pointer", 
                mobileTab === 'library' ? "bg-accent text-white shadow-md shadow-accent/20" : "text-white/50"
              )}
            >
              Library
            </button>
            <button 
              onClick={() => setMobileTab('effects')}
              className={clsx(
                "flex-1 py-2 text-center font-bold text-sm rounded-full transition-colors cursor-pointer", 
                mobileTab === 'effects' ? "bg-accent text-white shadow-md shadow-accent/20" : "text-white/50"
              )}
            >
              Effects
            </button>
          </div>
        </div>

        <div className={clsx(
          "flex-1 h-full overflow-y-auto w-full relative z-10 custom-scrollbar",
          mobileTab !== 'library' && "hidden lg:block"
        )}>
          <TrackList tracks={tracks} />
        </div>
        
        {/* Right side panel for effects */}
        <div className={clsx(
          "w-full lg:w-[400px] flex-col flex-shrink-0 bg-black/80 backdrop-blur-xl lg:border-l border-white/5 h-full overflow-y-auto p-6 pb-32 shadow-glass custom-scrollbar z-20",
          mobileTab !== 'effects' ? "hidden lg:flex" : "flex"
        )}>
          <div className="sticky top-0">
            <h2 className="text-2xl font-bold tracking-tight mb-8">Studio Effects</h2>
            <EffectControls />
            
            <button
              onClick={exportAudio}
              disabled={isExporting || tracks.length === 0}
              className={clsx(
                "w-full mt-8 py-4 rounded-full font-bold flex items-center justify-center gap-2 transition-all",
                isExporting 
                  ? "bg-white/10 text-white/50 cursor-not-allowed"
                  : "bg-white text-black hover:scale-[1.02] active:scale-[0.98] shadow-glow"
              )}
            >
              {isExporting ? (
                <>
                  <div className="w-5 h-5 rounded-full border-2 border-black/30 border-t-black animate-spin" />
                  Rendering...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" strokeWidth={2.5} />
                  Export Render
                </>
              )}
            </button>
          </div>
        </div>
      </main>

      <BottomPlayer />
    </div>
  );
}