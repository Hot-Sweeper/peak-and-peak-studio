import type { AudioFileInfo, EffectConfig, PlaybackState, EffectNode } from "./types";
import { DEFAULT_EFFECT_CONFIG } from "./types";
import { ReverbEffect, BassBoostEffect } from "./effects";

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private source: AudioBufferSourceNode | null = null;
  private analyser: AnalyserNode | null = null;
  private masterGain: GainNode | null = null;
  private fileInfo: AudioFileInfo | null = null;
  private effects: Map<string, EffectNode> = new Map();
  private config: EffectConfig = { ...DEFAULT_EFFECT_CONFIG };
  private state: PlaybackState = "idle";
  private position = 0;
  private lastTime = 0;

  private onStateChange?: (state: PlaybackState) => void;
  private onTimeUpdate?: (time: number) => void;
  private onEnded?: () => void;
  private animationFrame: number | null = null;

  getContext(): AudioContext | null {
    return this.ctx;
  }

  getAnalyser(): AnalyserNode | null {
    return this.analyser;
  }

  getState(): PlaybackState {
    return this.state;
  }

  getDuration(): number {
    return this.fileInfo ? this.fileInfo.duration : 0;
  }

  getCurrentTime(): number {
    if (!this.ctx || this.state === "idle") return 0;
    if (this.state === "paused") return this.position;
    return this.position + (this.ctx.currentTime - this.lastTime) * this.config.speed;
  }

  setCallbacks(cbs: {
    onStateChange?: (state: PlaybackState) => void;
    onTimeUpdate?: (time: number) => void;
    onEnded?: () => void;
  }) {
    this.onStateChange = cbs.onStateChange;
    this.onTimeUpdate = cbs.onTimeUpdate;
    this.onEnded = cbs.onEnded;
  }

  private async ensureContext(): Promise<AudioContext> {
    if (!this.ctx) {
      this.ctx = new AudioContext();
    }
    if (this.ctx.state === "suspended") {
      await this.ctx.resume();
    }
    return this.ctx;
  }

  private initEffects(ctx: AudioContext) {
    if (this.effects.size > 0) return;

    this.analyser = ctx.createAnalyser();
    this.analyser.fftSize = 2048;

    this.masterGain = ctx.createGain();

    const reverb = new ReverbEffect(ctx);
    const bassBoost = new BassBoostEffect(ctx);

    this.effects.set("reverb", reverb);
    this.effects.set("bassBoost", bassBoost);

    // Wire up the static chain exactly once
    let currentNode: AudioNode = reverb.getInput();
    // But wait, the standard is `connect(source)` which wires source to input, returns output.
    const reverbOut = reverb.getOutput();
    const bassBoostOut = bassBoost.connect(reverbOut); // reverOut -> bassBoostInput

    bassBoostOut.connect(this.analyser);
    this.analyser.connect(this.masterGain);
    this.masterGain.connect(ctx.destination);
    
    this.applyConfig();
  }

  async loadFile(file: File): Promise<AudioFileInfo> {
    const ctx = await this.ensureContext();
    this.initEffects(ctx);
    this.stop();

    const arrayBuffer = await file.arrayBuffer();
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer);

    this.fileInfo = {
      name: file.name,
      duration: audioBuffer.duration,
      sampleRate: audioBuffer.sampleRate,
      numberOfChannels: audioBuffer.numberOfChannels,
      buffer: audioBuffer,
    };

    return this.fileInfo;
  }

  private startTimeTracking() {
    const tick = () => {
      if (this.state === "playing") {
        this.onTimeUpdate?.(this.getCurrentTime());
        this.animationFrame = requestAnimationFrame(tick);
      }
    };
    this.animationFrame = requestAnimationFrame(tick);
  }

  private stopTimeTracking() {
    if (this.animationFrame !== null) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
  }

  private setState(state: PlaybackState) {
    this.state = state;
    this.onStateChange?.(state);
  }

  async play() {
    if (!this.fileInfo) return;
    const ctx = await this.ensureContext();

    if (this.state === "playing") {
      this.stopSource();
    }

    this.source = ctx.createBufferSource();
    this.source.buffer = this.fileInfo.buffer;
    this.source.playbackRate.value = this.config.speed;

    // Pitch shift via detune (cents) independent of speed
    this.source.detune.value = this.config.pitch * 100;

    const reverb = this.effects.get("reverb");
    if (reverb) {
      this.source.connect(reverb.getInput());
    }

    this.source.start(0, this.position);
    this.lastTime = ctx.currentTime;
    
    // Store reference to current source so onended only mutates if it matches
    const currentSource = this.source;
    
    this.source.onended = () => {
      if (this.state === "playing" && this.source === currentSource) {
        this.setState("idle");
        this.stopTimeTracking();
        this.position = 0;
        this.onTimeUpdate?.(0);
        this.onEnded?.();
      }
    };

    this.setState("playing");
    this.startTimeTracking();
  }

  pause() {
    if (this.state !== "playing") return;
    this.position = this.getCurrentTime();
    this.stopSource();
    this.setState("paused");
    this.stopTimeTracking();
  }

  stop() {
    this.stopSource();
    this.position = 0;
    this.lastTime = 0;
    this.setState("idle");
    this.stopTimeTracking();
    this.onTimeUpdate?.(0);
  }

  seek(time: number) {
    if (!this.fileInfo) return;
    
    const newPosition = Math.max(0, Math.min(time, this.fileInfo.duration));
    
    if (this.state === "playing") {
      this.position = newPosition;
      
      // Temporarily mark state as seeking so onended doesn't reset position
      const wasPlaying = true;
      this.setState("paused"); // prevents onended from firing idle logic
      this.stopSource();
      
      this.position = newPosition; // set again just in case
      this.play();
    } else {
      this.position = newPosition;
      this.onTimeUpdate?.(newPosition);
    }
  }

  private stopSource() {
    try {
      this.source?.stop();
    } catch {
      // already stopped
    }
    this.source?.disconnect();
    this.source = null;
  }

  setConfig(config: Partial<EffectConfig>) {
    if (this.state === "playing" && config.speed !== undefined) {
      this.position = this.getCurrentTime();
      this.lastTime = this.ctx?.currentTime ?? 0;
    }
    Object.assign(this.config, config);
    this.applyConfig();
  }

  getConfig(): EffectConfig {
    return { ...this.config };
  }

  private applyConfig() {
    const reverb = this.effects.get("reverb");
    const bassBoost = this.effects.get("bassBoost");

    reverb?.setParam("mix", this.config.reverb);
    bassBoost?.setParam("gain", this.config.bassBoost * 24);

    if (this.source) {
      this.source.playbackRate.setValueAtTime(
        this.config.speed,
        this.ctx?.currentTime ?? 0
      );
      this.source.detune.setValueAtTime(
        this.config.pitch * 100,
        this.ctx?.currentTime ?? 0
      );
    }
  }

  async exportAudio(): Promise<AudioBuffer> {
    if (!this.fileInfo) throw new Error("No audio loaded");

    const { buffer } = this.fileInfo;
    const duration = buffer.duration / this.config.speed;
    const sampleRate = buffer.sampleRate;
    const length = Math.ceil(duration * sampleRate);

    const offlineCtx = new OfflineAudioContext(
      buffer.numberOfChannels,
      length,
      sampleRate
    );

    const source = offlineCtx.createBufferSource();
    source.buffer = buffer;
    source.playbackRate.value = this.config.speed;
    source.detune.value = this.config.pitch * 100;

    const reverbEffect = new ReverbEffect(offlineCtx as unknown as AudioContext);
    const bassBoostEffect = new BassBoostEffect(offlineCtx as unknown as AudioContext);

    reverbEffect.setParam("mix", this.config.reverb);
    bassBoostEffect.setParam("gain", this.config.bassBoost * 24);

    let currentNode: AudioNode = source;
    currentNode = reverbEffect.connect(currentNode);
    currentNode = bassBoostEffect.connect(currentNode);
    currentNode.connect(offlineCtx.destination);

    source.start(0);

    const rendered = await offlineCtx.startRendering();

    reverbEffect.dispose();
    bassBoostEffect.dispose();

    return rendered;
  }

  dispose() {
    this.stop();
    for (const effect of this.effects.values()) {
      effect.dispose();
    }
    this.effects.clear();
    this.ctx?.close();
    this.ctx = null;
  }
}

export function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitsPerSample = 16;

  const channels: Float32Array[] = [];
  for (let i = 0; i < numChannels; i++) {
    channels.push(buffer.getChannelData(i));
  }

  const length = channels[0].length;
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const dataSize = length * numChannels * (bitsPerSample / 8);
  const headerSize = 44;

  const arrayBuffer = new ArrayBuffer(headerSize + dataSize);
  const view = new DataView(arrayBuffer);

  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, "WAVE");
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeString(view, 36, "data");
  view.setUint32(40, dataSize, true);

  let offset = 44;
  for (let i = 0; i < length; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      const sample = Math.max(-1, Math.min(1, channels[ch][i]));
      const int16 = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
      view.setInt16(offset, int16, true);
      offset += 2;
    }
  }

  return new Blob([arrayBuffer], { type: "audio/wav" });
}

function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}
