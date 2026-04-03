import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AudioFileInfo, EffectConfig, PlaybackState } from "@/lib/audio/types";
import { DEFAULT_EFFECT_CONFIG } from "@/lib/audio/types";
import { AudioEngine, audioBufferToWav } from "@/lib/audio/engine";
import { getTrackFile } from "@/lib/db/client";

import { useLibraryStore } from "@/stores/library-store";

interface AudioStore {
  engine: AudioEngine;
  fileInfo: AudioFileInfo | null;
  playbackState: PlaybackState;
  currentTime: number;
  config: EffectConfig;
  isExporting: boolean;
  randomizeEffects: Partial<Record<keyof EffectConfig, boolean>>;

  // Base methods
  loadFile: (file: File) => Promise<void>;
  loadTrackFromDb: (id: string) => Promise<boolean>;
  play: () => Promise<void>;
  pause: () => void;
  stop: () => void;
  seek: (time: number) => void;
  setConfig: (config: Partial<EffectConfig>) => void;
  resetConfig: () => void;
  exportAudio: () => Promise<void>;
  dispose: () => void;

  // Effects randomization
  toggleRandomize: (key: keyof EffectConfig) => void;
  applyRandomizedEffects: () => void;
}

const getRandomValueForEffect = (key: keyof EffectConfig) => {
  switch (key) {
    case 'speed': return Math.random() * (1.5 - 0.5) + 0.5;
    case 'pitch': return Math.floor(Math.random() * 24) - 12;
    case 'reverb': return Math.random();
    case 'bassBoost': return Math.random();
    default: return undefined;
  }
};

export const useAudioStore = create<AudioStore>()(
  persist(
    (set, get) => {
      const engine = new AudioEngine();

      engine.setCallbacks({
        onStateChange: (playbackState) => set({ playbackState }),
        onTimeUpdate: (currentTime) => set({ currentTime }),
        onEnded: async () => {
          const state = useLibraryStore.getState();
          const nextId = state.nextTrack();
          if (nextId) {
            await get().loadTrackFromDb(nextId);
            get().play();
          } else {
            get().seek(0);
            get().pause();
          }
        }
      });

  return {
    engine,
    fileInfo: null,
    playbackState: "idle",
    currentTime: 0,
    config: { ...DEFAULT_EFFECT_CONFIG },
    isExporting: false,
    randomizeEffects: {},

    async loadFile(file: File) {
      engine.stop(); // Always stop before loading new
      const fileInfo = await engine.loadFile(file);
      get().applyRandomizedEffects();
      engine.setConfig(get().config);
      set({ fileInfo, currentTime: 0 });
    },

    async loadTrackFromDb(id: string) {
      const file = await getTrackFile(id);
      if (!file) return false;
      await get().loadFile(file);
      return true;
    },

    toggleRandomize(key: keyof EffectConfig) {
      set((state) => {
        const next = { ...state.randomizeEffects };
        if (next[key]) delete next[key];
        else next[key] = true;
        return { randomizeEffects: next };
      });
    },

    applyRandomizedEffects() {
      const { randomizeEffects, config } = get();
      let updated = false;
      const nextConfig = { ...config };
      
      for (const k of Object.keys(randomizeEffects) as Array<keyof EffectConfig>) {
        if (randomizeEffects[k]) {
          const v = getRandomValueForEffect(k);
          if (v !== undefined) {
             (nextConfig as any)[k] = v;
             updated = true;
          }
        }
      }
      
      if (updated) {
        set({ config: nextConfig });
        // The engine setConfig will happen down the pipeline naturally
      }
    },

    async play() {
      await engine.play();
    },

    pause() {
      engine.pause();
    },

    stop() {
      engine.stop();
    },

    seek(time: number) {
      engine.seek(time);
      set({ currentTime: time });
    },

    setConfig(partial: Partial<EffectConfig>) {
      const config = { ...get().config, ...partial };
      set({ config });
      engine.setConfig(partial);
    },

    resetConfig() {
      const config = { ...DEFAULT_EFFECT_CONFIG };
      set({ config });
      engine.setConfig(config);
    },

    async exportAudio() {
      set({ isExporting: true });
      try {
        const rendered = await engine.exportAudio();
        const blob = audioBufferToWav(rendered);

        const fileInfo = get().fileInfo;
        const baseName = fileInfo?.name.replace(/\.[^.]+$/, "") ?? "track";
        const fileName = `${baseName}_slowed_reverb.wav`;

        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
      } finally {
        set({ isExporting: false });
      }
    },

    dispose() {
      engine.dispose();
    },
  };
},
{
      name: "peak-audio-storage",
      partialize: (state) => ({
        config: state.config,
        randomizeEffects: state.randomizeEffects,
      }),
    }
  )
);
