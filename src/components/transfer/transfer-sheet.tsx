"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import clsx from "clsx";
import QRCode from "qrcode";
import { ArrowDownToLine, ArrowUpFromLine, Check, Copy, Share2, X } from "lucide-react";
import { formatCode } from "@/lib/share/code";
import { useLibraryStore } from "@/stores/library-store";
import { useTransferStore } from "@/stores/transfer-store";

export function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(bytes < 10 * 1024 * 1024 ? 1 : 0)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

const plural = (n: number, word: string) => `${n.toLocaleString()} ${word}${n === 1 ? "" : "s"}`;

function shareLink(code: string) {
  return `${window.location.origin}/r/${formatCode(code)}`;
}

export function TransferSheet() {
  const { sheetOpen, tab, setTab, closeSheet } = useTransferStore();
  const sendPhase = useTransferStore((s) => s.send.phase);
  const receivePhase = useTransferStore((s) => s.receive.phase);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const [closing, setClosing] = useState(false);
  const titleId = useId();

  const busy = ["preparing", "uploading", "finishing"].includes(sendPhase) || ["downloading", "waiting"].includes(receivePhase);

  // Open and close the native dialog so focus trapping, Escape and the top layer come for free.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (sheetOpen && !dialog.open) {
      returnFocusRef.current = document.activeElement as HTMLElement | null;
      setClosing(false);
      dialog.showModal();
      // Focus the sheet itself, so no button starts out highlighted. Tab moves into the controls.
      dialog.focus();
    } else if (!sheetOpen && dialog.open) {
      setClosing(true);
    }
  }, [sheetOpen]);

  const finishClose = useCallback(() => {
    const dialog = dialogRef.current;
    if (!dialog || !closing) return;
    dialog.close();
    setClosing(false);
    returnFocusRef.current?.focus?.();
  }, [closing]);

  // Reduced motion has no exit animation to wait for.
  useEffect(() => {
    if (closing && window.matchMedia("(prefers-reduced-motion: reduce)").matches) finishClose();
  }, [closing, finishClose]);

  // Leaving the page mid-transfer would cut it off; ask first.
  useEffect(() => {
    if (!busy) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [busy]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      tabIndex={-1}
      data-closing={closing ? "" : undefined}
      onCancel={(e) => {
        e.preventDefault();
        closeSheet();
      }}
      onClick={(e) => {
        if (e.target === dialogRef.current) closeSheet();
      }}
      onAnimationEnd={(e) => {
        if (e.target === dialogRef.current) finishClose();
      }}
      className="transfer-dialog"
    >
      <div className="flex flex-col max-h-[inherit]">
        <header className="flex items-center justify-between gap-4 px-6 pt-5 pb-4">
          <h2 id={titleId} className="text-xl font-bold tracking-tight text-white">
            Transfer library
          </h2>
          <button
            type="button"
            onClick={closeSheet}
            aria-label="Close"
            className="press -mr-2 w-11 h-11 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        <div className="px-6">
          <div role="tablist" aria-label="Transfer direction" className="relative grid grid-cols-2 bg-white/5 p-1 rounded-full">
            <span
              aria-hidden="true"
              className="segment-indicator absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] rounded-full bg-accent shadow-md shadow-accent/20"
              style={{ transform: tab === "receive" ? "translateX(100%)" : "translateX(0)" }}
            />
            {(["send", "receive"] as const).map((t) => (
              <button
                key={t}
                type="button"
                role="tab"
                aria-selected={tab === t}
                onClick={() => setTab(t)}
                className={clsx(
                  "press relative z-10 py-2.5 text-sm font-bold rounded-full transition-colors cursor-pointer flex items-center justify-center gap-2",
                  tab === t ? "text-white" : "text-white/55 hover:text-white/80"
                )}
              >
                {t === "send" ? <ArrowUpFromLine className="w-4 h-4" /> : <ArrowDownToLine className="w-4 h-4" />}
                {t === "send" ? "Send" : "Receive"}
              </button>
            ))}
          </div>
        </div>

        <div role="tabpanel" className="flex-1 overflow-y-auto overscroll-contain px-6 pt-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          {sheetOpen || closing ? tab === "send" ? <SendPanel /> : <ReceivePanel /> : null}
        </div>
      </div>
    </dialog>
  );
}

function ProgressBar({ value, label }: { value: number; label: string }) {
  const clamped = Math.max(0, Math.min(1, value));
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(clamped * 100)}
      className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden"
    >
      <div className="progress-fill h-full w-full origin-left rounded-full bg-accent" style={{ transform: `scaleX(${clamped})` }} />
    </div>
  );
}

function PrimaryButton({ children, onClick, disabled }: { children: React.ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="press w-full min-h-12 py-3.5 rounded-full font-bold bg-accent hover:bg-accent-hover text-white shadow-glow transition-colors cursor-pointer disabled:bg-white/10 disabled:text-white/40 disabled:shadow-none disabled:cursor-not-allowed"
    >
      {children}
    </button>
  );
}

function QuietButton({ children, onClick, tone = "default" }: { children: React.ReactNode; onClick: () => void; tone?: "default" | "danger" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        "press min-h-11 px-4 rounded-full text-sm font-semibold transition-colors cursor-pointer",
        tone === "danger" ? "text-[#ff6b81] hover:bg-accent/10" : "text-white/70 hover:text-white hover:bg-white/10"
      )}
    >
      {children}
    </button>
  );
}

/* ───────────────────────────── Send ───────────────────────────── */

function SendPanel() {
  const tracks = useLibraryStore((s) => s.tracks);
  const { send, startSend, pauseSend, stopSharing } = useTransferStore();
  const [confirmStop, setConfirmStop] = useState(false);
  const libraryBytes = tracks.reduce((n, t) => n + t.size, 0);
  const active = ["preparing", "uploading", "finishing"].includes(send.phase);

  if (send.phase === "checking") {
    return <p className="text-white/50 text-sm py-8 text-center">Checking your shared library…</p>;
  }

  if (send.phase === "idle" || (send.phase === "error" && !send.code)) {
    return (
      <div className="flex flex-col gap-5">
        <div>
          <p className="text-white font-semibold text-lg">Send your library</p>
          <p className="text-white/50 text-sm tabular-nums mt-0.5">
            {plural(tracks.length, "song")} · {formatBytes(libraryBytes)}
          </p>
        </div>
        <p className="text-white/70 text-sm leading-relaxed">
          Peak uploads your songs to its server and gives you a code. Enter the code in Peak on your other device and every song
          downloads there, playlists included. The code works for 7 days or until you stop sharing.
        </p>
        {send.error && (
          <p role="alert" className="text-[#ff6b81] text-sm leading-relaxed">
            {send.error}
          </p>
        )}
        <PrimaryButton onClick={startSend} disabled={tracks.length === 0}>
          {send.error ? "Try again" : "Share library"}
        </PrimaryButton>
        {tracks.length === 0 && <p className="text-white/50 text-sm text-center">Add some songs first, then share them.</p>}
      </div>
    );
  }

  const progress = send.totalBytes ? send.sentBytes / send.totalBytes : 0;

  return (
    <div className="flex flex-col gap-6">
      <section aria-live="polite" className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between gap-4">
          <p className="text-white font-semibold">
            {send.phase === "ready"
              ? "Your library is ready to receive"
              : send.phase === "paused"
                ? "Sharing paused"
                : send.phase === "error"
                  ? "Upload stopped"
                  : send.phase === "finishing"
                    ? "Finishing up…"
                    : send.phase === "preparing"
                      ? "Getting ready…"
                      : "Uploading your library"}
          </p>
          {send.phase !== "ready" && send.totalBytes > 0 && (
            <span className="text-white/50 text-sm tabular-nums shrink-0">{Math.floor(progress * 100)}%</span>
          )}
        </div>
        {send.phase !== "ready" && send.totalCount > 0 && (
          <>
            <ProgressBar value={progress} label="Upload progress" />
            <p className="text-white/50 text-sm tabular-nums">
              {send.doneCount.toLocaleString()} of {plural(send.totalCount, "song")} · {formatBytes(send.sentBytes)} of {formatBytes(send.totalBytes)}
            </p>
            {send.currentName && <p className="text-white/55 text-xs truncate">Now: {send.currentName}</p>}
          </>
        )}
        {send.phase === "ready" && (
          <p className="text-white/50 text-sm tabular-nums">
            {plural(send.totalCount, "song")} · {formatBytes(send.totalBytes)} uploaded
          </p>
        )}
        {active && (
          <p className="text-white/60 text-sm leading-relaxed">
            Keep Peak open on this screen until the upload finishes. The other device can start receiving right away.
          </p>
        )}
        {send.error && (
          <p role="alert" className="text-[#ff6b81] text-sm leading-relaxed">
            {send.error}
          </p>
        )}
        {(send.phase === "paused" || send.phase === "error") && <PrimaryButton onClick={startSend}>Resume upload</PrimaryButton>}
      </section>

      {send.code && <CodeCard code={send.code} />}

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-4">
        <p className="text-white/55 text-xs">
          {send.expiresAt ? `Works until ${new Date(send.expiresAt).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" })}` : ""}
        </p>
        <div className="flex items-center gap-1">
          {active && <QuietButton onClick={pauseSend}>Pause</QuietButton>}
          {confirmStop ? (
            <>
              <QuietButton onClick={() => setConfirmStop(false)}>Keep sharing</QuietButton>
              <QuietButton
                tone="danger"
                onClick={() => {
                  setConfirmStop(false);
                  void stopSharing();
                }}
              >
                Delete from server
              </QuietButton>
            </>
          ) : (
            <QuietButton tone="danger" onClick={() => setConfirmStop(true)}>
              Stop sharing
            </QuietButton>
          )}
        </div>
      </div>
      {confirmStop && (
        <p className="text-white/50 text-xs -mt-4 text-right">The code stops working. Songs on both devices stay where they are.</p>
      )}
    </div>
  );
}

function CodeCard({ code }: { code: string }) {
  const [qr, setQr] = useState<string | null>(null);
  const [copied, setCopied] = useState<"code" | "link" | null>(null);
  const [canShare, setCanShare] = useState(false);
  const link = shareLink(code);

  useEffect(() => {
    let cancelled = false;
    QRCode.toString(link, { type: "svg", margin: 1, errorCorrectionLevel: "M", color: { dark: "#000000", light: "#ffffff" } })
      .then((svg) => !cancelled && setQr(svg))
      .catch(() => setQr(null));
    setCanShare(typeof navigator.share === "function");
    return () => {
      cancelled = true;
    };
  }, [link]);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(null), 1600);
    return () => clearTimeout(t);
  }, [copied]);

  const copy = async (what: "code" | "link") => {
    try {
      await navigator.clipboard.writeText(what === "code" ? formatCode(code) : link);
      setCopied(what);
    } catch {
      // Clipboard blocked; the code and link stay visible and selectable.
    }
  };

  return (
    <section aria-label="Transfer code" className="rounded-[24px] bg-bg-elevated border border-border-glass p-5 flex flex-col items-center gap-4">
      <p className="text-white/50 text-xs font-semibold uppercase tracking-wider">Transfer code</p>
      <button
        type="button"
        onClick={() => copy("code")}
        aria-label={`Transfer code ${formatCode(code).split("").join(" ")}. Tap to copy.`}
        className="press relative font-mono text-[34px] leading-none font-bold tracking-[0.12em] text-white select-all cursor-pointer px-3 py-2 rounded-xl hover:bg-white/5 transition-colors"
      >
        {formatCode(code)}
        <span
          aria-hidden="true"
          className={clsx("copied-badge absolute -top-3 right-0 text-[11px] font-sans font-bold tracking-normal text-accent", copied === "code" && "is-visible")}
        >
          Copied
        </span>
      </button>

      <div className="w-[172px] h-[172px] rounded-2xl bg-white p-2.5 flex items-center justify-center">
        {qr ? (
          <div className="w-full h-full [&>svg]:w-full [&>svg]:h-full" role="img" aria-label="QR code for the share link" dangerouslySetInnerHTML={{ __html: qr }} />
        ) : (
          <div className="w-full h-full rounded-lg bg-black/5" aria-hidden="true" />
        )}
      </div>

      <p className="text-white/60 text-sm text-center leading-relaxed max-w-[34ch]">
        On your other device, open Peak, tap <span className="text-white">Transfer</span>, choose <span className="text-white">Receive</span> and
        enter this code. Or scan the QR code with its camera.
      </p>

      <div className="flex flex-wrap justify-center gap-2 w-full">
        <button
          type="button"
          onClick={() => copy("link")}
          className="press min-h-11 flex-1 min-w-[140px] px-4 rounded-full bg-white/10 hover:bg-white/15 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          <span className="icon-swap relative w-4 h-4" data-swapped={copied === "link" ? "" : undefined}>
            <Copy className="icon-a absolute inset-0 w-4 h-4" />
            <Check className="icon-b absolute inset-0 w-4 h-4 text-accent" />
          </span>
          {copied === "link" ? "Link copied" : "Copy link"}
        </button>
        {canShare && (
          <button
            type="button"
            onClick={() => navigator.share({ title: "My Peak library", text: `Get my Peak library with code ${formatCode(code)}`, url: link }).catch(() => {})}
            className="press min-h-11 flex-1 min-w-[140px] px-4 rounded-full bg-white/10 hover:bg-white/15 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
            Share link
          </button>
        )}
      </div>
    </section>
  );
}

/* ──────────────────────────── Receive ──────────────────────────── */

function ReceivePanel() {
  const { receive, lookup, startReceive, cancelReceive, resetReceive, closeSheet } = useTransferStore();
  const [input, setInput] = useState(receive.code ? formatCode(receive.code) : "");
  const inputId = useId();
  const hintId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (receive.phase === "idle") inputRef.current?.focus({ preventScroll: true });
  }, [receive.phase]);

  const showForm = receive.phase === "idle" || receive.phase === "looking" || (receive.phase === "error" && !receive.manifest);

  if (showForm) {
    return (
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (receive.phase !== "looking") void lookup(input);
        }}
      >
        <div className="flex flex-col gap-2">
          <label htmlFor={inputId} className="text-white font-semibold">
            Transfer code
          </label>
          <input
            ref={inputRef}
            id={inputId}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            aria-describedby={hintId}
            aria-invalid={receive.phase === "error" || undefined}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="characters"
            spellCheck={false}
            enterKeyHint="go"
            placeholder="K7MQ-2P9X"
            className="w-full h-14 px-4 rounded-2xl bg-white/5 border border-border-glass text-white font-mono text-2xl tracking-[0.12em] uppercase placeholder:text-white/20 placeholder:normal-case transition-colors"
          />
          <p id={hintId} className="text-white/50 text-sm leading-relaxed">
            Get the code on the device that has your songs: Transfer, then Send. You can also paste the share link here.
          </p>
        </div>
        {receive.phase === "error" && receive.error && (
          <p role="alert" className="text-[#ff6b81] text-sm leading-relaxed">
            {receive.error}
          </p>
        )}
        <button
          type="submit"
          disabled={!input.trim()}
          aria-busy={receive.phase === "looking"}
          className="press w-full min-h-12 py-3.5 rounded-full font-bold bg-accent hover:bg-accent-hover text-white shadow-glow transition-colors cursor-pointer disabled:bg-white/10 disabled:text-white/40 disabled:shadow-none disabled:cursor-not-allowed"
        >
          {receive.phase === "looking" ? "Looking up code…" : "Find library"}
        </button>
      </form>
    );
  }

  const m = receive.manifest!;
  const uploadedCount = m.uploaded.length;
  const stillUploading = m.status === "uploading";
  const progress = receive.newBytes ? receive.receivedBytes / receive.newBytes : 0;

  return (
    <div className="flex flex-col gap-5" aria-live="polite">
      <div className="rounded-[24px] bg-bg-elevated border border-border-glass p-5">
        <p className="text-white/50 text-xs font-semibold uppercase tracking-wider">Library {formatCode(m.code)}</p>
        <p className="text-white text-2xl font-bold tracking-tight mt-1 tabular-nums">{plural(m.tracks.length, "song")}</p>
        <p className="text-white/50 text-sm tabular-nums">
          {formatBytes(m.totalBytes)}
          {m.playlists.length > 0 && ` · ${plural(m.playlists.length, "playlist")}`}
        </p>
        {stillUploading && (
          <p className="text-white/60 text-sm mt-3 leading-relaxed tabular-nums">
            The other device is still uploading: {uploadedCount.toLocaleString()} of {m.tracks.length.toLocaleString()} songs are ready. Songs download here as they
            arrive.
          </p>
        )}
      </div>

      {receive.phase === "preview" && (
        <>
          {receive.newCount === 0 ? (
            <p className="text-white/70 text-sm leading-relaxed">Every song in this library is already on this device.</p>
          ) : (
            <p className="text-white/70 text-sm leading-relaxed tabular-nums">
              {plural(receive.newCount, "new song")} ({formatBytes(receive.newBytes)}) will be added to your library.
              {receive.alreadyHaveCount > 0 && ` ${plural(receive.alreadyHaveCount, "song")} you already have will be skipped.`} Wi-Fi is a good
              idea for big libraries.
            </p>
          )}
          {receive.storageWarning && <p className="text-warning text-sm leading-relaxed">{receive.storageWarning}</p>}
          {receive.newCount === 0 ? (
            <PrimaryButton onClick={closeSheet}>Done</PrimaryButton>
          ) : (
            <PrimaryButton onClick={startReceive}>Add {plural(receive.newCount, "song")}</PrimaryButton>
          )}
          <QuietButton onClick={resetReceive}>Use a different code</QuietButton>
        </>
      )}

      {(receive.phase === "downloading" || receive.phase === "waiting") && (
        <section className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between gap-4">
            <p className="text-white font-semibold">
              {receive.phase === "waiting" ? (
                <span className="inline-flex items-center gap-2">
                  <span className="waiting-dot w-2 h-2 rounded-full bg-accent" aria-hidden="true" />
                  Waiting for the other device
                </span>
              ) : (
                "Adding songs"
              )}
            </p>
            <span className="text-white/50 text-sm tabular-nums shrink-0">{Math.floor(progress * 100)}%</span>
          </div>
          <ProgressBar value={progress} label="Download progress" />
          <p className="text-white/50 text-sm tabular-nums">
            {receive.doneCount.toLocaleString()} of {plural(receive.newCount, "song")} · {formatBytes(receive.receivedBytes)} of {formatBytes(receive.newBytes)}
          </p>
          {receive.currentName && <p className="text-white/55 text-xs truncate">Now: {receive.currentName}</p>}
          <p className="text-white/60 text-sm leading-relaxed">
            {receive.phase === "waiting"
              ? "The next songs are still uploading. Keep Peak open on both devices."
              : "Keep Peak open on this screen. Songs appear in your library as they arrive."}
          </p>
          <div>
            <QuietButton onClick={cancelReceive}>Stop</QuietButton>
          </div>
        </section>
      )}

      {receive.phase === "done" && (
        <section className="flex flex-col items-center gap-3 py-2 text-center">
          <span className="done-check w-14 h-14 rounded-full bg-accent flex items-center justify-center shadow-glow" aria-hidden="true">
            <Check className="w-7 h-7 text-white" strokeWidth={3} />
          </span>
          <p className="text-white text-lg font-semibold tabular-nums">{plural(receive.doneCount, "song")} added</p>
          <p className="text-white/50 text-sm">Your library on this device is up to date.</p>
          <div className="w-full mt-2">
            <PrimaryButton
              onClick={() => {
                closeSheet();
                resetReceive();
              }}
            >
              Done
            </PrimaryButton>
          </div>
        </section>
      )}

      {receive.phase === "error" && (
        <>
          <p role="alert" className="text-[#ff6b81] text-sm leading-relaxed">
            {receive.error}
          </p>
          <PrimaryButton onClick={startReceive}>Try again</PrimaryButton>
          <QuietButton onClick={resetReceive}>Use a different code</QuietButton>
        </>
      )}
    </div>
  );
}

/** The header button. While a transfer runs it shows live progress so closing the sheet never hides it. */
export function TransferButton({ className }: { className?: string }) {
  const openSheet = useTransferStore((s) => s.openSheet);
  const send = useTransferStore((s) => s.send);
  const receive = useTransferStore((s) => s.receive);

  let tab: "send" | "receive" | undefined;
  let percent = 0;
  if (["preparing", "uploading", "finishing"].includes(send.phase)) {
    percent = send.totalBytes ? Math.floor((send.sentBytes / send.totalBytes) * 100) : 0;
    tab = "send";
  } else if (receive.phase === "downloading" || receive.phase === "waiting") {
    percent = receive.newBytes ? Math.floor((receive.receivedBytes / receive.newBytes) * 100) : 0;
    tab = "receive";
  }
  const Icon = tab === "send" ? ArrowUpFromLine : ArrowDownToLine;

  return (
    <button
      type="button"
      onClick={() => openSheet(tab)}
      className={clsx(
        "press relative bg-white/10 hover:bg-white/15 text-white font-bold py-2 md:py-3 px-4 md:px-6 rounded-full transition-colors text-sm md:text-base flex-shrink-0 cursor-pointer select-none tabular-nums",
        className
      )}
    >
      {tab ? (
        <span className="flex items-center gap-1.5" aria-label={`${tab === "send" ? "Sending" : "Receiving"} library, ${percent}%`}>
          <Icon className="w-4 h-4" aria-hidden="true" />
          <span className="hidden sm:inline" aria-hidden="true">{tab === "send" ? "Sending" : "Receiving"}</span>
          <span aria-hidden="true">{percent}%</span>
        </span>
      ) : (
        "Transfer"
      )}
    </button>
  );
}
