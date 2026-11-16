"use client";

import { create } from "zustand";
import { addTrack, getAllPlaylists, getAllTrackMeta, getTrackData, mergePlaylist } from "@/lib/db/client";
import { normalizeCode, type ShareManifest, type SharedTrack } from "@/lib/share/code";
import { useLibraryStore } from "@/stores/library-store";

/**
 * Moves a whole library between devices through the Peak server.
 *
 * Sending: register the song list (gets a code), upload songs one by one,
 * then mark the share complete. The code is shown from the first second, so
 * the other device can start receiving while songs are still uploading.
 *
 * Receiving: poll the manifest, download every song that has arrived and
 * is not already in this library, and store it in IndexedDB.
 *
 * Both sides skip work that is already done, so "Try again" after a dropped
 * connection or a locked screen simply continues where it stopped.
 */

export type SendPhase = "idle" | "checking" | "preparing" | "uploading" | "paused" | "finishing" | "ready" | "error";
export type ReceivePhase = "idle" | "looking" | "preview" | "downloading" | "waiting" | "done" | "error";

interface SendState {
  phase: SendPhase;
  code: string | null;
  expiresAt: number | null;
  doneCount: number;
  totalCount: number;
  sentBytes: number;
  totalBytes: number;
  currentName: string | null;
  error: string | null;
}

interface ReceiveState {
  phase: ReceivePhase;
  code: string | null;
  manifest: ShareManifest | null;
  /** Songs in the share that this device does not have yet. */
  newCount: number;
  newBytes: number;
  alreadyHaveCount: number;
  doneCount: number;
  receivedBytes: number;
  currentName: string | null;
  error: string | null;
  storageWarning: string | null;
}

interface TransferStore {
  sheetOpen: boolean;
  tab: "send" | "receive";
  send: SendState;
  receive: ReceiveState;

  openSheet: (tab?: "send" | "receive", code?: string | null) => void;
  closeSheet: () => void;
  setTab: (tab: "send" | "receive") => void;

  restoreSendSession: () => Promise<void>;
  startSend: () => Promise<void>;
  pauseSend: () => void;
  stopSharing: () => Promise<void>;

  lookup: (input: string) => Promise<void>;
  startReceive: () => Promise<void>;
  cancelReceive: () => void;
  resetReceive: () => void;
}

const SESSION_KEY = "peak-share-session";

interface SendSession {
  code: string;
  token: string;
  expiresAt: number;
  trackIds: string[];
}

const initialSend: SendState = {
  phase: "idle",
  code: null,
  expiresAt: null,
  doneCount: 0,
  totalCount: 0,
  sentBytes: 0,
  totalBytes: 0,
  currentName: null,
  error: null,
};

const initialReceive: ReceiveState = {
  phase: "idle",
  code: null,
  manifest: null,
  newCount: 0,
  newBytes: 0,
  alreadyHaveCount: 0,
  doneCount: 0,
  receivedBytes: 0,
  currentName: null,
  error: null,
  storageWarning: null,
};

function loadSession(): SendSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as SendSession;
    return session.expiresAt > Date.now() ? session : null;
  } catch {
    return null;
  }
}

function saveSession(session: SendSession | null) {
  try {
    if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    else localStorage.removeItem(SESSION_KEY);
  } catch {
    // Private mode or blocked storage: the transfer still works, it just cannot resume after a reload.
  }
}

async function readError(res: Response, fallback: string) {
  try {
    const body = await res.json();
    if (typeof body?.error === "string") return body.error as string;
  } catch {
    // not JSON
  }
  return fallback;
}

class TransferError extends Error {
  constructor(message: string, public fatal = false) {
    super(message);
  }
}

const sleep = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener("abort", () => {
      clearTimeout(timer);
      reject(new DOMException("Aborted", "AbortError"));
    });
  });

const isAbort = (err: unknown) => err instanceof DOMException && err.name === "AbortError";

/** Retries network hiccups (phones switching between Wi-Fi and mobile data) with backoff. */
async function withRetry<T>(task: () => Promise<T>, signal: AbortSignal, attempts = 5): Promise<T> {
  let lastError: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await task();
    } catch (err) {
      if (isAbort(err) || (err instanceof TransferError && err.fatal)) throw err;
      lastError = err;
      await sleep(1000 * 2 ** i, signal);
    }
  }
  throw lastError;
}

function uploadWithProgress(url: string, token: string, file: Blob, signal: AbortSignal, onProgress: (loaded: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.setRequestHeader("Content-Type", "application/octet-stream");
    xhr.upload.onprogress = (e) => onProgress(e.loaded);
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) return resolve();
      let message = "The server rejected a song.";
      try {
        message = JSON.parse(xhr.responseText).error ?? message;
      } catch {
        // keep default
      }
      // 4xx other than 409 will not get better by retrying.
      reject(new TransferError(message, xhr.status >= 400 && xhr.status < 500 && xhr.status !== 409));
    };
    xhr.onerror = () => reject(new TransferError("The connection dropped while uploading."));
    xhr.ontimeout = () => reject(new TransferError("The upload timed out."));
    const abort = () => {
      xhr.abort();
      reject(new DOMException("Aborted", "AbortError"));
    };
    if (signal.aborted) return abort();
    signal.addEventListener("abort", abort, { once: true });
    xhr.send(file);
  });
}

async function downloadWithProgress(url: string, signal: AbortSignal, onProgress: (loaded: number) => void) {
  const res = await fetch(url, { signal, cache: "no-store" });
  if (!res.ok) throw new TransferError(await readError(res, "A song could not be downloaded."), res.status === 404);
  if (!res.body) return res.blob();
  const reader = res.body.getReader();
  const chunks: BlobPart[] = [];
  let loaded = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value as BlobPart);
    loaded += value.byteLength;
    onProgress(loaded);
  }
  return new Blob(chunks);
}

/** Keeps the phone screen on during a transfer so iOS does not suspend the page. */
function createWakeLock() {
  let sentinel: { release: () => Promise<void> } | null = null;
  let active = false;
  const request = async () => {
    try {
      const nav = navigator as Navigator & { wakeLock?: { request: (type: "screen") => Promise<{ release: () => Promise<void> }> } };
      if (active && nav.wakeLock && document.visibilityState === "visible") sentinel = await nav.wakeLock.request("screen");
    } catch {
      // Not supported or denied: the transfer still runs, the screen may just lock.
    }
  };
  const onVisible = () => {
    if (document.visibilityState === "visible") void request();
  };
  return {
    async acquire() {
      active = true;
      document.addEventListener("visibilitychange", onVisible);
      await request();
    },
    release() {
      active = false;
      document.removeEventListener("visibilitychange", onVisible);
      void sentinel?.release().catch(() => {});
      sentinel = null;
    },
  };
}

let sendAbort: AbortController | null = null;
let receiveAbort: AbortController | null = null;

function trackKey(t: { name: string; size: number }) {
  return `${t.name}\u0000${t.size}`;
}

/** Works out which songs in a share are new to this device. */
async function compareWithLocal(manifest: ShareManifest) {
  const local = await getAllTrackMeta();
  const byId = new Set(local.map((t) => t.id));
  const byKey = new Map(local.map((t) => [trackKey(t), t.id]));
  const idMap = new Map<string, string>();
  const missing: SharedTrack[] = [];
  for (const t of manifest.tracks) {
    if (byId.has(t.id)) idMap.set(t.id, t.id);
    else if (byKey.has(trackKey(t))) idMap.set(t.id, byKey.get(trackKey(t))!);
    else missing.push(t);
  }
  return { idMap, missing };
}

export const useTransferStore = create<TransferStore>()((set, get) => {
  const patchSend = (patch: Partial<SendState>) => set((s) => ({ send: { ...s.send, ...patch } }));
  const patchReceive = (patch: Partial<ReceiveState>) => set((s) => ({ receive: { ...s.receive, ...patch } }));

  return {
    sheetOpen: false,
    tab: "send",
    send: initialSend,
    receive: initialReceive,

    openSheet: (tab, code) => {
      set({ sheetOpen: true, tab: tab ?? get().tab });
      if (tab === "receive" && code) {
        const normalized = normalizeCode(code);
        const busy = ["looking", "downloading", "waiting"].includes(get().receive.phase);
        if (normalized && !busy && normalized !== get().receive.code) void get().lookup(normalized);
      }
      if ((tab ?? get().tab) === "send" && get().send.phase === "idle") void get().restoreSendSession();
    },
    closeSheet: () => set({ sheetOpen: false }),
    setTab: (tab) => {
      set({ tab });
      if (tab === "send" && get().send.phase === "idle") void get().restoreSendSession();
    },

    restoreSendSession: async () => {
      const session = loadSession();
      if (!session) return;
      patchSend({ phase: "checking", code: session.code, expiresAt: session.expiresAt });
      try {
        const res = await fetch(`/api/share/${session.code}`, { cache: "no-store" });
        if (res.status === 404) {
          saveSession(null);
          set({ send: initialSend });
          return;
        }
        if (!res.ok) throw new Error();
        const manifest = (await res.json()) as ShareManifest;
        const uploaded = new Set(manifest.uploaded);
        const sentBytes = manifest.tracks.filter((t) => uploaded.has(t.id)).reduce((n, t) => n + t.size, 0);
        patchSend({
          phase: manifest.status === "ready" ? "ready" : "paused",
          doneCount: uploaded.size,
          totalCount: manifest.tracks.length,
          sentBytes,
          totalBytes: manifest.totalBytes,
        });
      } catch {
        patchSend({ phase: "paused", error: null });
      }
    },

    startSend: async () => {
      if (["preparing", "uploading", "finishing"].includes(get().send.phase)) return;
      sendAbort?.abort();
      const abort = new AbortController();
      sendAbort = abort;
      const wakeLock = createWakeLock();
      await wakeLock.acquire();

      try {
        patchSend({ phase: "preparing", error: null });
        const [tracks, playlists] = await Promise.all([getAllTrackMeta(), getAllPlaylists()]);
        if (tracks.length === 0) throw new TransferError("Your library is empty, so there is nothing to share yet.", true);

        const ids = tracks.map((t) => t.id).sort();
        let session = loadSession();
        const sameLibrary = session && session.trackIds.length === ids.length && session.trackIds.every((id, i) => id === ids[i]);

        let uploaded = new Set<string>();
        if (session && sameLibrary) {
          const res = await fetch(`/api/share/${session.code}`, { cache: "no-store", signal: abort.signal });
          if (res.ok) uploaded = new Set(((await res.json()) as ShareManifest).uploaded);
          else session = null;
        } else if (session) {
          // The library changed since the last share. Replace the old share with a fresh one.
          void fetch(`/api/share/${session.code}`, { method: "DELETE", headers: { Authorization: `Bearer ${session.token}` } });
          session = null;
        }

        if (!session) {
          const res = await withRetry(async () => {
            const r = await fetch("/api/share", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ tracks, playlists }),
              signal: abort.signal,
            });
            if (r.status >= 400 && r.status < 500 || r.status === 507 || r.status === 503) {
              throw new TransferError(await readError(r, "The server did not accept this library."), true);
            }
            if (!r.ok) throw new TransferError(await readError(r, "Could not reach the Peak server."));
            return r;
          }, abort.signal);
          const created = (await res.json()) as { code: string; token: string; expiresAt: number };
          session = { ...created, trackIds: ids };
          saveSession(session);
        }

        const totalBytes = tracks.reduce((n, t) => n + t.size, 0);
        let sentBytes = tracks.filter((t) => uploaded.has(t.id)).reduce((n, t) => n + t.size, 0);
        patchSend({
          phase: "uploading",
          code: session.code,
          expiresAt: session.expiresAt,
          totalCount: tracks.length,
          doneCount: uploaded.size,
          totalBytes,
          sentBytes,
        });

        // Oldest first, so the receiving library fills up in its original order.
        for (const meta of [...tracks].reverse()) {
          if (uploaded.has(meta.id)) continue;
          const data = await getTrackData(meta.id);
          if (!data) continue;
          patchSend({ currentName: meta.name });
          const { code, token } = session;
          await withRetry(
            () =>
              uploadWithProgress(`/api/share/${code}/tracks/${encodeURIComponent(meta.id)}`, token, data.file, abort.signal, (loaded) =>
                patchSend({ sentBytes: sentBytes + Math.min(loaded, meta.size) })
              ),
            abort.signal
          );
          sentBytes += meta.size;
          uploaded.add(meta.id);
          patchSend({ sentBytes, doneCount: uploaded.size });
        }

        patchSend({ phase: "finishing", currentName: null });
        const { code, token } = session;
        await withRetry(async () => {
          const r = await fetch(`/api/share/${code}/complete`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
            signal: abort.signal,
          });
          if (!r.ok) throw new TransferError(await readError(r, "Could not finish the share."), r.status === 409 || r.status === 404);
        }, abort.signal);
        patchSend({ phase: "ready" });
      } catch (err) {
        if (isAbort(err)) {
          patchSend({ phase: get().send.code ? "paused" : "idle", currentName: null });
        } else {
          const message =
            err instanceof TransferError ? err.message : "The connection to the Peak server dropped. Check your internet and try again.";
          patchSend({ phase: "error", error: message, currentName: null });
        }
      } finally {
        wakeLock.release();
        if (sendAbort === abort) sendAbort = null;
      }
    },

    pauseSend: () => sendAbort?.abort(),

    stopSharing: async () => {
      sendAbort?.abort();
      const session = loadSession();
      if (session) {
        try {
          await fetch(`/api/share/${session.code}`, { method: "DELETE", headers: { Authorization: `Bearer ${session.token}` } });
        } catch {
          // The share expires on its own after 7 days.
        }
      }
      saveSession(null);
      set({ send: initialSend });
    },

    lookup: async (input) => {
      const code = normalizeCode(input);
      if (!code) {
        set({ receive: { ...initialReceive, phase: "error", error: "That does not look like a transfer code. Codes have 8 letters and numbers, like K7MQ-2P9X." } });
        return;
      }
      receiveAbort?.abort();
      set({ receive: { ...initialReceive, phase: "looking", code } });
      try {
        const res = await fetch(`/api/share/${code}`, { cache: "no-store" });
        if (!res.ok) {
          throw new TransferError(
            res.status === 404
              ? "No library found for this code. Check the code, or ask for a new one (codes stop working after 7 days or when sharing is stopped)."
              : await readError(res, "Could not reach the Peak server.")
          );
        }
        const manifest = (await res.json()) as ShareManifest;
        const { missing } = await compareWithLocal(manifest);
        const newBytes = missing.reduce((n, t) => n + t.size, 0);

        let storageWarning: string | null = null;
        try {
          const estimate = await navigator.storage?.estimate?.();
          if (estimate?.quota && estimate.usage !== undefined && estimate.quota - estimate.usage < newBytes * 1.05) {
            storageWarning = "This device may not have enough free browser storage for every song. Peak will add as many as fit.";
          }
        } catch {
          // Estimate not available.
        }

        patchReceive({
          phase: "preview",
          manifest,
          newCount: missing.length,
          newBytes,
          alreadyHaveCount: manifest.tracks.length - missing.length,
          storageWarning,
        });
      } catch (err) {
        patchReceive({ phase: "error", error: err instanceof TransferError ? err.message : "Could not reach the Peak server. Check your internet and try again." });
      }
    },

    startReceive: async () => {
      const { code } = get().receive;
      if (!code || ["downloading", "waiting"].includes(get().receive.phase)) return;
      receiveAbort?.abort();
      const abort = new AbortController();
      receiveAbort = abort;
      const wakeLock = createWakeLock();
      await wakeLock.acquire();
      // Ask the browser not to evict the library when storage gets tight.
      void navigator.storage?.persist?.().catch(() => false);

      const refreshLibrary = useLibraryStore.getState().refresh;
      let lastRefresh = 0;
      let lastProgressAt = Date.now();
      let added = 0;

      try {
        patchReceive({ phase: "downloading", error: null, doneCount: 0, receivedBytes: 0 });
        let manifest = get().receive.manifest!;
        const handled = new Set<string>();
        let idMap = new Map<string, string>();

        for (;;) {
          const res = await withRetry(async () => {
            const r = await fetch(`/api/share/${code}`, { cache: "no-store", signal: abort.signal });
            if (r.status === 404) throw new TransferError("This shared library was stopped or has expired.", true);
            if (!r.ok) throw new TransferError("Could not reach the Peak server.");
            return r;
          }, abort.signal);
          manifest = (await res.json()) as ShareManifest;
          const compared = await compareWithLocal(manifest);
          idMap = compared.idMap;
          const pending = compared.missing.filter((t) => !handled.has(t.id));
          const available = new Set(manifest.uploaded);
          const ready = pending.filter((t) => available.has(t.id));
          const newBytes = compared.missing.reduce((n, t) => n + t.size, 0) + get().receive.receivedBytes;
          patchReceive({ manifest, newCount: compared.missing.length + added, newBytes });

          if (pending.length === 0) break;
          if (ready.length === 0) {
            if (Date.now() - lastProgressAt > 20 * 60 * 1000) {
              throw new TransferError("The other device has not uploaded anything for 20 minutes. Open Peak on it and resume sharing, then try again here.");
            }
            patchReceive({ phase: "waiting", currentName: null });
            await sleep(2500, abort.signal);
            continue;
          }

          patchReceive({ phase: "downloading" });
          for (const t of ready) {
            patchReceive({ currentName: t.name });
            const base = get().receive.receivedBytes;
            const blob = await withRetry(
              () =>
                downloadWithProgress(`/api/share/${code}/tracks/${encodeURIComponent(t.id)}`, abort.signal, (loaded) =>
                  patchReceive({ receivedBytes: base + Math.min(loaded, t.size) })
                ),
              abort.signal
            );
            const file = new File([blob], t.name, { type: t.type || blob.type });
            try {
              await addTrack({ id: t.id, name: t.name, size: file.size, type: t.type, createdAt: t.createdAt, file });
            } catch (err) {
              if (err instanceof DOMException && err.name === "QuotaExceededError") {
                throw new TransferError(
                  `This device ran out of storage after ${added} songs. Free up some space, then tap Try again to continue with the rest.`
                );
              }
              throw err;
            }
            handled.add(t.id);
            idMap.set(t.id, t.id);
            added++;
            lastProgressAt = Date.now();
            patchReceive({ doneCount: added, receivedBytes: base + t.size });
            if (Date.now() - lastRefresh > 1500) {
              lastRefresh = Date.now();
              void refreshLibrary();
            }
          }
        }

        for (const pl of manifest.playlists) {
          const trackIds = pl.trackIds.map((id) => idMap.get(id)).filter((id): id is string => !!id);
          await mergePlaylist({ ...pl, trackIds });
        }
        await refreshLibrary();
        patchReceive({ phase: "done", currentName: null });
      } catch (err) {
        await refreshLibrary();
        if (isAbort(err)) {
          patchReceive({ phase: "preview", currentName: null });
          void get().lookup(code);
        } else {
          patchReceive({
            phase: "error",
            currentName: null,
            error: err instanceof TransferError ? err.message : "The download stopped. Check your internet and tap Try again; songs already added stay in your library.",
          });
        }
      } finally {
        wakeLock.release();
        if (receiveAbort === abort) receiveAbort = null;
      }
    },

    cancelReceive: () => receiveAbort?.abort(),

    resetReceive: () => {
      receiveAbort?.abort();
      set({ receive: initialReceive });
    },
  };
});
