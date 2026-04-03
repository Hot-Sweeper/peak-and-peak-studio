import { openDB, DBSchema, IDBPDatabase } from 'idb';

export interface TrackMeta {
  id: string;
  name: string;
  size: number;
  type: string;
  createdAt: number;
}

export interface TrackData extends TrackMeta {
  file: File;
}

export interface Playlist {
  id: string;
  name: string;
  trackIds: string[];
  createdAt: number;
}

interface PeakDBSchema extends DBSchema {
  tracks: {
    key: string;
    value: TrackData;
  };
  playlists: {
    key: string;
    value: Playlist;
  };
}

let dbPromise: Promise<IDBPDatabase<PeakDBSchema>> | null = null;

function getDB() {
  if (typeof window === 'undefined') return null; // Avoid SSR issues
  if (!dbPromise) {
    dbPromise = openDB<PeakDBSchema>('peak-studio-db', 1, {
      upgrade(db) {
        db.createObjectStore('tracks', { keyPath: 'id' });
        db.createObjectStore('playlists', { keyPath: 'id' });
      },
    });
  }
  return dbPromise;
}

export async function addTrack(track: TrackData): Promise<void> {
  const db = await getDB();
  if (!db) return;
  await db.put('tracks', track);
}

export async function deleteTrack(id: string): Promise<void> {
  const db = await getDB();
  if (!db) return;
  await db.delete('tracks', id);
  
  // Remove from playlists
  const playlists = await getAllPlaylists();
  for (const pl of playlists) {
    if (pl.trackIds.includes(id)) {
      pl.trackIds = pl.trackIds.filter(tId => tId !== id);
      await db.put('playlists', pl);
    }
  }
}

export async function getTrackFile(id: string): Promise<File | null> {
  const db = await getDB();
  if (!db) return null;
  const track = await db.get('tracks', id);
  return track ? track.file : null;
}

export async function getAllTrackMeta(): Promise<TrackMeta[]> {
  const db = await getDB();
  if (!db) return [];
  const tracks = await db.getAll('tracks');
  return tracks.map(({ file, ...meta }) => meta).sort((a, b) => b.createdAt - a.createdAt);
}

export async function addPlaylist(playlist: Playlist): Promise<void> {
  const db = await getDB();
  if (!db) return;
  await db.put('playlists', playlist);
}

export async function deletePlaylist(id: string): Promise<void> {
  const db = await getDB();
  if (!db) return;
  await db.delete('playlists', id);
}

export async function getAllPlaylists(): Promise<Playlist[]> {
  const db = await getDB();
  if (!db) return [];
  const playlists = await db.getAll('playlists');
  return playlists.sort((a, b) => b.createdAt - a.createdAt);
}