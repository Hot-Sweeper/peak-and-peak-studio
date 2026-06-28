/** Minimal silent WAV — keeps iOS media session active alongside Web Audio. */
const SILENT_AUDIO_SRC =
  "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA";

type BackgroundHandlers = {
  onPlay: () => void | Promise<void>;
  onPause: () => void;
  onNext?: () => void | Promise<void>;
  onPrev?: () => void | Promise<void>;
};

function isContextSuspended(ctx: AudioContext): boolean {
  return ctx.state === "suspended" || (ctx.state as string) === "interrupted";
}

export class BackgroundPlayback {
  private silentAudio: HTMLAudioElement | null = null;
  private handlers: BackgroundHandlers | null = null;
  private ctx: AudioContext | null = null;
  private wantsPlaying = false;
  private mediaSessionReady = false;

  init(handlers: BackgroundHandlers) {
    this.handlers = handlers;
    this.ensureSilentAudio();
    this.bindLifecycleEvents();
  }

  /** Tell iOS/Safari this page is a media player so audio continues when locked. */
  configurePlaybackSession() {
    if ("audioSession" in navigator) {
      navigator.audioSession.type = "playback";
    }
  }

  setAudioContext(ctx: AudioContext) {
    if (this.ctx === ctx) return;
    this.ctx?.removeEventListener("statechange", this.onContextStateChange);
    this.ctx = ctx;
    ctx.addEventListener("statechange", this.onContextStateChange);
  }

  private bindLifecycleEvents() {
    if (typeof document === "undefined") return;
    document.addEventListener("visibilitychange", this.onVisibilityChange);
    window.addEventListener("pageshow", this.onVisibilityChange);
    window.addEventListener("focus", this.onVisibilityChange);
  }

  private onVisibilityChange = () => {
    if (this.wantsPlaying) {
      void this.resumeAudioPipeline();
    }
  };

  private onContextStateChange = () => {
    if (!this.ctx || !this.wantsPlaying) return;
    if (isContextSuspended(this.ctx)) {
      void this.resumeAudioPipeline();
    }
  };

  private ensureSilentAudio() {
    if (typeof document === "undefined" || this.silentAudio) return;

    const audio = document.createElement("audio");
    audio.setAttribute("playsinline", "");
    audio.setAttribute("webkit-playsinline", "");
    audio.loop = true;
    audio.preload = "auto";
    audio.volume = 0.001;
    audio.src = SILENT_AUDIO_SRC;
    audio.style.display = "none";
    document.body.appendChild(audio);
    this.silentAudio = audio;
  }

  private async playSilentKeeper() {
    if (!this.silentAudio) return;
    try {
      await this.silentAudio.play();
    } catch {
      // Autoplay guard — main Web Audio playback still works if session is configured.
    }
  }

  private pauseSilentKeeper() {
    this.silentAudio?.pause();
    if (this.silentAudio) this.silentAudio.currentTime = 0;
  }

  async resumeAudioPipeline() {
    this.configurePlaybackSession();
    if (this.ctx && isContextSuspended(this.ctx)) {
      try {
        await this.ctx.resume();
      } catch {
        // Resume may require a fresh user gesture after a hard interrupt.
      }
    }
    if (this.wantsPlaying) {
      await this.playSilentKeeper();
    }
  }

  private setupMediaSession() {
    if (!("mediaSession" in navigator) || !this.handlers || this.mediaSessionReady) return;

    const { onPlay, onPause, onNext, onPrev } = this.handlers;
    navigator.mediaSession.setActionHandler("play", () => void onPlay());
    navigator.mediaSession.setActionHandler("pause", () => onPause());
    if (onNext) {
      navigator.mediaSession.setActionHandler("nexttrack", () => void onNext());
    }
    if (onPrev) {
      navigator.mediaSession.setActionHandler("previoustrack", () => void onPrev());
    }
    this.mediaSessionReady = true;
  }

  setMetadata(title: string, artist = "Peak Studio") {
    if (!("mediaSession" in navigator)) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title,
      artist,
      album: "Peak Studio",
    });
  }

  setPlaybackState(playing: boolean) {
    this.wantsPlaying = playing;
    if (!("mediaSession" in navigator)) return;
    navigator.mediaSession.playbackState = playing ? "playing" : "paused";
  }

  setPositionState(duration: number, position: number, playbackRate: number) {
    if (!("mediaSession" in navigator) || !navigator.mediaSession.setPositionState) return;
    if (duration <= 0) return;
    try {
      navigator.mediaSession.setPositionState({
        duration,
        position: Math.max(0, Math.min(position, duration)),
        playbackRate: Math.max(0.1, playbackRate),
      });
    } catch {
      // Some browsers reject invalid position states.
    }
  }

  async onPlaybackStart(ctx: AudioContext) {
    this.setAudioContext(ctx);
    this.configurePlaybackSession();
    this.setupMediaSession();
    await this.resumeAudioPipeline();
    this.setPlaybackState(true);
  }

  onPlaybackPause() {
    this.setPlaybackState(false);
    this.pauseSilentKeeper();
  }

  onPlaybackStop() {
    this.wantsPlaying = false;
    this.setPlaybackState(false);
    this.pauseSilentKeeper();
  }

  dispose() {
    document.removeEventListener("visibilitychange", this.onVisibilityChange);
    window.removeEventListener("pageshow", this.onVisibilityChange);
    window.removeEventListener("focus", this.onVisibilityChange);
    this.ctx?.removeEventListener("statechange", this.onContextStateChange);
    this.silentAudio?.remove();
    this.silentAudio = null;
  }
}

export const backgroundPlayback = new BackgroundPlayback();
