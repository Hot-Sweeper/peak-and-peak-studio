import { createHash, randomBytes, randomInt, timingSafeEqual } from "node:crypto";
import { createReadStream, createWriteStream } from "node:fs";
import { mkdir, readdir, readFile, rename, rm, stat, statfs, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { Readable, Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import {
  CODE_ALPHABET,
  CODE_LENGTH,
  SHARE_TTL_MS,
  TRACK_ID_PATTERN,
  isValidCode,
  type ShareManifest,
  type SharedPlaylist,
  type SharedTrack,
} from "./code";

/**
 * Shared libraries live on disk, one folder per code:
 *   <root>/<CODE>/share.json        manifest + hashed upload token
 *   <root>/<CODE>/tracks/<trackId>  audio, written to .part first, renamed when complete
 *
 * On Railway, attach a volume and the files survive redeploys
 * (Railway sets RAILWAY_VOLUME_MOUNT_PATH automatically). Without a volume
 * they live on the container disk until the next deploy, which is enough
 * for a one-off phone-to-phone transfer.
 */
const ROOT =
  process.env.SHARE_STORAGE_DIR ||
  (process.env.RAILWAY_VOLUME_MOUNT_PATH
    ? path.join(process.env.RAILWAY_VOLUME_MOUNT_PATH, "peak-shares")
    : path.join(tmpdir(), "peak-shares"));

const MB = 1024 * 1024;
const MAX_TRACK_BYTES = Number(process.env.SHARE_MAX_TRACK_MB || 500) * MB;
const MAX_SHARE_BYTES = Number(process.env.SHARE_MAX_TOTAL_MB || 20 * 1024) * MB;
const MAX_TRACKS = 5000;
const MAX_ACTIVE_SHARES = Number(process.env.SHARE_MAX_ACTIVE || 50);
const DISK_HEADROOM_BYTES = 256 * MB;

interface StoredShare {
  code: string;
  tokenHash: string;
  status: "uploading" | "ready";
  createdAt: number;
  expiresAt: number;
  tracks: SharedTrack[];
  playlists: SharedPlaylist[];
}

export class ShareError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

function shareDir(code: string) {
  return path.join(ROOT, code);
}

function tracksDir(code: string) {
  return path.join(shareDir(code), "tracks");
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function generateCode() {
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i++) code += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
  return code;
}

async function readShare(code: string): Promise<StoredShare | null> {
  if (!isValidCode(code)) return null;
  try {
    const share = JSON.parse(await readFile(path.join(shareDir(code), "share.json"), "utf8")) as StoredShare;
    if (share.expiresAt < Date.now()) {
      await rm(shareDir(code), { recursive: true, force: true });
      return null;
    }
    return share;
  } catch {
    return null;
  }
}

async function writeShare(share: StoredShare) {
  const file = path.join(shareDir(share.code), "share.json");
  await writeFile(`${file}.tmp`, JSON.stringify(share));
  await rename(`${file}.tmp`, file);
}

async function requireShare(code: string) {
  const share = await readShare(code);
  if (!share) {
    throw new ShareError(404, "No shared library found for this code. It may have expired or been stopped.");
  }
  return share;
}

function requireToken(share: StoredShare, token: string | null) {
  const expected = Buffer.from(share.tokenHash, "hex");
  const given = Buffer.from(hashToken(token ?? ""), "hex");
  if (!token || !timingSafeEqual(expected, given)) {
    throw new ShareError(403, "This device is not allowed to change that shared library.");
  }
}

async function uploadedIds(code: string): Promise<string[]> {
  try {
    const names = await readdir(tracksDir(code));
    return names.filter((n) => !n.endsWith(".part"));
  } catch {
    return [];
  }
}

/** Removes expired shares. Cheap enough to run whenever a share is created. */
async function sweepExpired(): Promise<number> {
  let active = 0;
  let codes: string[] = [];
  try {
    codes = await readdir(ROOT);
  } catch {
    return 0;
  }
  for (const code of codes) {
    if (await readShare(code)) active++;
  }
  return active;
}

function sanitizeTracks(input: unknown): SharedTrack[] {
  if (!Array.isArray(input) || input.length === 0) {
    throw new ShareError(400, "There are no songs to share.");
  }
  if (input.length > MAX_TRACKS) {
    throw new ShareError(413, `A shared library can hold up to ${MAX_TRACKS} songs.`);
  }
  const seen = new Set<string>();
  return input.map((raw) => {
    const t = raw as Partial<SharedTrack>;
    if (typeof t.id !== "string" || !TRACK_ID_PATTERN.test(t.id) || seen.has(t.id)) {
      throw new ShareError(400, "The song list is malformed.");
    }
    seen.add(t.id);
    const size = Number(t.size);
    if (!Number.isFinite(size) || size <= 0) throw new ShareError(400, "The song list is malformed.");
    if (size > MAX_TRACK_BYTES) {
      throw new ShareError(413, `"${String(t.name).slice(0, 80)}" is larger than ${MAX_TRACK_BYTES / MB} MB.`);
    }
    return {
      id: t.id,
      name: String(t.name ?? "Untitled").slice(0, 300),
      type: String(t.type ?? "").slice(0, 100),
      size,
      createdAt: Number(t.createdAt) || Date.now(),
    };
  });
}

function sanitizePlaylists(input: unknown, trackIds: Set<string>): SharedPlaylist[] {
  if (!Array.isArray(input)) return [];
  return input.slice(0, 500).flatMap((raw) => {
    const p = raw as Partial<SharedPlaylist>;
    if (typeof p.id !== "string" || !TRACK_ID_PATTERN.test(p.id) || !Array.isArray(p.trackIds)) return [];
    return [
      {
        id: p.id,
        name: String(p.name ?? "Playlist").slice(0, 200),
        trackIds: p.trackIds.filter((id): id is string => typeof id === "string" && trackIds.has(id)),
        createdAt: Number(p.createdAt) || Date.now(),
      },
    ];
  });
}

export async function createShare(body: unknown) {
  const { tracks: rawTracks, playlists: rawPlaylists } = (body ?? {}) as Record<string, unknown>;
  const tracks = sanitizeTracks(rawTracks);
  const playlists = sanitizePlaylists(rawPlaylists, new Set(tracks.map((t) => t.id)));
  const totalBytes = tracks.reduce((sum, t) => sum + t.size, 0);

  if (totalBytes > MAX_SHARE_BYTES) {
    throw new ShareError(
      413,
      `This library is ${(totalBytes / MB / 1024).toFixed(1)} GB. The server accepts up to ${(MAX_SHARE_BYTES / MB / 1024).toFixed(0)} GB per share.`
    );
  }

  await mkdir(ROOT, { recursive: true });
  const active = await sweepExpired();
  if (active >= MAX_ACTIVE_SHARES) {
    throw new ShareError(503, "The server is holding too many shared libraries right now. Try again later.");
  }

  const disk = await statfs(ROOT);
  const free = disk.bavail * disk.bsize;
  if (free < totalBytes + DISK_HEADROOM_BYTES) {
    throw new ShareError(
      507,
      `The server only has ${(free / MB / 1024).toFixed(1)} GB of free space, but this library needs ${(totalBytes / MB / 1024).toFixed(1)} GB.`
    );
  }

  let code = generateCode();
  while (await readShare(code)) code = generateCode();

  const token = randomBytes(32).toString("base64url");
  const now = Date.now();
  const share: StoredShare = {
    code,
    tokenHash: hashToken(token),
    status: "uploading",
    createdAt: now,
    expiresAt: now + SHARE_TTL_MS,
    tracks,
    playlists,
  };
  await mkdir(tracksDir(code), { recursive: true });
  await writeShare(share);
  return { code, token, expiresAt: share.expiresAt };
}

export async function getManifest(code: string): Promise<ShareManifest> {
  const share = await requireShare(code);
  return {
    code: share.code,
    status: share.status,
    createdAt: share.createdAt,
    expiresAt: share.expiresAt,
    totalBytes: share.tracks.reduce((sum, t) => sum + t.size, 0),
    tracks: share.tracks,
    playlists: share.playlists,
    uploaded: await uploadedIds(code),
  };
}

export async function storeTrack(code: string, trackId: string, token: string | null, body: ReadableStream<Uint8Array> | null) {
  const share = await requireShare(code);
  requireToken(share, token);
  const track = share.tracks.find((t) => t.id === trackId);
  if (!track) throw new ShareError(404, "That song is not part of this shared library.");
  if (!body) throw new ShareError(400, "The upload was empty.");

  const finalPath = path.join(tracksDir(code), trackId);
  const partPath = `${finalPath}.part`;
  let received = 0;
  const limit = new Transform({
    transform(chunk: Buffer, _enc, done) {
      received += chunk.length;
      if (received > track.size) done(new ShareError(400, "The upload is larger than the song it claims to be."));
      else done(null, chunk);
    },
  });

  try {
    await pipeline(Readable.fromWeb(body as import("node:stream/web").ReadableStream), limit, createWriteStream(partPath));
  } catch (err) {
    await rm(partPath, { force: true });
    if (err instanceof ShareError) throw err;
    throw new ShareError(400, "The upload was interrupted.");
  }

  if (received !== track.size) {
    await rm(partPath, { force: true });
    throw new ShareError(400, "The upload was interrupted before the whole song arrived.");
  }
  await rename(partPath, finalPath);
}

export async function completeShare(code: string, token: string | null) {
  const share = await requireShare(code);
  requireToken(share, token);
  const have = new Set(await uploadedIds(code));
  const missing = share.tracks.filter((t) => !have.has(t.id)).length;
  if (missing > 0) throw new ShareError(409, `${missing} ${missing === 1 ? "song has" : "songs have"} not finished uploading yet.`);
  share.status = "ready";
  await writeShare(share);
}

export async function deleteShare(code: string, token: string | null) {
  const share = await requireShare(code);
  requireToken(share, token);
  await rm(shareDir(code), { recursive: true, force: true });
}

export async function openTrack(code: string, trackId: string) {
  const share = await requireShare(code);
  const track = share.tracks.find((t) => t.id === trackId);
  if (!track || !TRACK_ID_PATTERN.test(trackId)) throw new ShareError(404, "That song is not part of this shared library.");
  const file = path.join(tracksDir(code), trackId);
  try {
    const info = await stat(file);
    return { track, size: info.size, stream: Readable.toWeb(createReadStream(file)) as ReadableStream<Uint8Array> };
  } catch {
    throw new ShareError(409, "That song has not finished uploading yet.");
  }
}

export function bearerToken(request: Request): string | null {
  const header = request.headers.get("authorization");
  return header?.startsWith("Bearer ") ? header.slice(7) : null;
}

export function errorResponse(err: unknown) {
  if (err instanceof ShareError) {
    return Response.json({ error: err.message }, { status: err.status });
  }
  console.error("[share]", err);
  return Response.json({ error: "The server could not handle that request. Try again in a moment." }, { status: 500 });
}
