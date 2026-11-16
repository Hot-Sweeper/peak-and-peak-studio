/**
 * Transfer codes are short enough to type on a phone and long enough that
 * nobody can guess one: 8 characters from a 31-letter alphabet without
 * look-alikes (no 0/O, 1/I/L).
 */
export const CODE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
export const CODE_LENGTH = 8;

/** How long a shared library stays downloadable. */
export const SHARE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const CODE_PATTERN = new RegExp(`^[${CODE_ALPHABET}]{${CODE_LENGTH}}$`);

/**
 * Accepts whatever people paste or type: "k7mq-2p9x", "K7MQ 2P9X", or a full
 * share link like https://host/r/K7MQ-2P9X. Returns the bare code or null.
 */
export function normalizeCode(input: string): string | null {
  let text = input.trim();
  const fromLink = text.match(/\/r\/([A-Za-z0-9 -]+)/) ?? text.match(/[?&]receive=([A-Za-z0-9-]+)/);
  if (fromLink) text = fromLink[1];
  const cleaned = text.toUpperCase().replace(/[\s-]/g, "");
  return CODE_PATTERN.test(cleaned) ? cleaned : null;
}

export function isValidCode(code: string): boolean {
  return CODE_PATTERN.test(code);
}

/** "K7MQ2P9X" -> "K7MQ-2P9X" */
export function formatCode(code: string): string {
  return `${code.slice(0, 4)}-${code.slice(4)}`;
}

export const TRACK_ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

export interface SharedTrack {
  id: string;
  name: string;
  type: string;
  size: number;
  createdAt: number;
}

export interface SharedPlaylist {
  id: string;
  name: string;
  trackIds: string[];
  createdAt: number;
}

export interface ShareManifest {
  code: string;
  status: "uploading" | "ready";
  createdAt: number;
  expiresAt: number;
  totalBytes: number;
  tracks: SharedTrack[];
  playlists: SharedPlaylist[];
  /** IDs of tracks whose audio has fully arrived on the server. */
  uploaded: string[];
}
