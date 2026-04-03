import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { nanoid } from 'nanoid';
import { TrackMeta, Playlist, addTrack, deleteTrack, getAllTrackMeta, addPlaylist, deletePlaylist, getAllPlaylists } from '@/lib/db/client';

export interface LibraryState {
  tracks: TrackMeta[];
  playlists: Playlist[];
  isLoading: boolean;
  
  // Playback/Queue state
  queue: string[]; // List of track IDs
  history: string[]; // Track IDs played
  currentIndex: number; // Index in the queue
  repeatMode: 'off' | 'all' | 'one';
  isShuffling: boolean;
  
  // Shuffle proxy array
  shuffledQueue: string[];

  // Actions
  init: () => Promise<void>;
  uploadFiles: (files: File[]) => Promise<void>;
  removeTrack: (id: string) => Promise<void>;
  createPlaylist: (name: string, trackIds?: string[]) => Promise<void>;
  removePlaylist: (id: string) => Promise<void>;
  addTrackToPlaylist: (playlistId: string, trackId: string) => Promise<void>;
  removeTrackFromPlaylist: (playlistId: string, trackId: string) => Promise<void>;
  
  // Plaback Control actions
  playTrack: (id: string, queueContext?: string[]) => void; // Play specific track & build queue
  nextTrack: () => string | null; // Returns ID to play
  prevTrack: () => string | null;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  
  // Getters
  getCurrentTrackMeta: () => TrackMeta | null;
  getEffectiveQueue: () => string[];
}

// Simple Fisher-Yates shuffle
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export const useLibraryStore = create<LibraryState>()(
  persist(
    (set, get) => ({
      tracks: [],
      playlists: [],
      isLoading: true,
      
      queue: [],
      history: [],
      currentIndex: -1,
      repeatMode: 'off',
      isShuffling: false,
      shuffledQueue: [],

      init: async () => {
        set({ isLoading: true });
        const [tracks, playlists] = await Promise.all([
          getAllTrackMeta(),
          getAllPlaylists()
        ]);
        set({ tracks, playlists, isLoading: false });
      },

      uploadFiles: async (files: File[]) => {
        set({ isLoading: true });
        for (const file of files) {
          if (!file.type.startsWith('audio/')) continue;
          
          const meta = {
            id: nanoid(),
            name: file.name.replace(/\.[^/.]+$/, ""), // remove extension
            size: file.size,
            type: file.type,
            createdAt: Date.now()
          };
          
          await addTrack({ ...meta, file });
        }
        
        // Refresh
        const tracks = await getAllTrackMeta();
        set({ tracks, isLoading: false });
      },

      removeTrack: async (id: string) => {
        await deleteTrack(id);
        const [tracks, playlists] = await Promise.all([
          getAllTrackMeta(),
          getAllPlaylists()
        ]);
        set({ tracks, playlists });
      },

      createPlaylist: async (name: string, trackIds: string[] = []) => {
        const pl: Playlist = {
          id: nanoid(),
          name,
          trackIds,
          createdAt: Date.now()
        };
        await addPlaylist(pl);
        const playlists = await getAllPlaylists();
        set({ playlists });
      },
      
      removePlaylist: async (id: string) => {
        await deletePlaylist(id);
        const playlists = await getAllPlaylists();
        set({ playlists });
      },

      addTrackToPlaylist: async (playlistId: string, trackId: string) => {
        const { playlists } = get();
        const pl = playlists.find(p => p.id === playlistId);
        if (!pl) return;
        if (pl.trackIds.includes(trackId)) return;
        
        pl.trackIds.push(trackId);
        await addPlaylist(pl);
        set({ playlists: await getAllPlaylists() });
      },

      removeTrackFromPlaylist: async (playlistId: string, trackId: string) => {
        const { playlists } = get();
        const pl = playlists.find(p => p.id === playlistId);
        if (!pl) return;
        
        pl.trackIds = pl.trackIds.filter(id => id !== trackId);
        await addPlaylist(pl);
        set({ playlists: await getAllPlaylists() });
      },

      playTrack: (id: string, queueContext?: string[]) => {
        const { isShuffling } = get();
        const q = queueContext || get().tracks.map(t => t.id); // fallback to all library
        
        const qIndex = q.indexOf(id);
        
        if (isShuffling) {
          // Exclude the current track from random shuffle
          const rest = q.filter(t => t !== id);
          const shuffled = [id, ...shuffleArray(rest)];
          set({
            queue: q,
            shuffledQueue: shuffled,
            currentIndex: 0,
            history: []
          });
        } else {
          set({
            queue: q,
            shuffledQueue: [],
            currentIndex: Math.max(0, qIndex),
            history: []
          });
        }
      },

      nextTrack: () => {
        const { queue, shuffledQueue, isShuffling, currentIndex, repeatMode } = get();
        const activeQueue = isShuffling ? shuffledQueue : queue;
        
        if (activeQueue.length === 0) return null;

        // Repeat One - keep same index
        if (repeatMode === 'one') {
          return activeQueue[currentIndex];
        }

        let nextIdx = currentIndex + 1;
        
        if (nextIdx >= activeQueue.length) {
          if (repeatMode === 'all') {
            nextIdx = 0;
          } else {
            return null; // end of queue
          }
        }
        
        // Push current to history
        const activeId = activeQueue[currentIndex];
        set(state => ({ history: [...state.history, activeId], currentIndex: nextIdx }));
        
        return activeQueue[nextIdx];
      },

      prevTrack: () => {
        const { history, queue, shuffledQueue, isShuffling, currentIndex } = get();
        const activeQueue = isShuffling ? shuffledQueue : queue;
        
        if (history.length > 0) {
          const newHistory = [...history];
          const prevId = newHistory.pop()!;
          
          const prevIdx = activeQueue.indexOf(prevId);
          set({ history: newHistory, currentIndex: Math.max(0, prevIdx) });
          return prevId;
        }

        // no history, go to start of queue
        set({ currentIndex: 0 });
        return activeQueue[0] || null;
      },

      toggleShuffle: () => {
        const { isShuffling, queue, currentIndex, shuffledQueue } = get();
        
        if (isShuffling) {
          // Turning off shuffle: find current track in original queue
          const currentId = shuffledQueue[currentIndex];
          const newIndex = Math.max(0, queue.indexOf(currentId));
          set({ isShuffling: false, shuffledQueue: [], currentIndex: newIndex });
        } else {
          // Turning on shuffle: build new proxy queue starting with current
          const currentId = queue[currentIndex];
          const rest = queue.filter(id => id !== currentId);
          const shuffled = [currentId, ...shuffleArray(rest)];
          set({ isShuffling: true, shuffledQueue: shuffled, currentIndex: 0 });
        }
      },

      toggleRepeat: () => {
        const { repeatMode } = get();
        const nextMode = repeatMode === 'off' ? 'all' : repeatMode === 'all' ? 'one' : 'off';
        set({ repeatMode: nextMode });
      },

      getEffectiveQueue: () => {
        const { queue, shuffledQueue, isShuffling } = get();
        return isShuffling ? shuffledQueue : queue;
      },
      
      getCurrentTrackMeta: () => {
        const { tracks, currentIndex } = get();
        const activeQueue = get().getEffectiveQueue();
        if (activeQueue.length === 0 || currentIndex < 0 || currentIndex >= activeQueue.length) return null;
        
        const currentId = activeQueue[currentIndex];
        return tracks.find(t => t.id === currentId) || null;
      }
    }),
    {
      name: 'peak-library-storage',
      partialize: (state) => ({ 
        // Persist only identifiers and modes, not full tracks/playlists (IDB handles that)
        queue: state.queue, 
        history: state.history, 
        currentIndex: state.currentIndex, 
        repeatMode: state.repeatMode, 
        isShuffling: state.isShuffling,
        shuffledQueue: state.shuffledQueue
      })
    }
  )
);