export interface EffectNode {
  readonly name: string;
  enabled: boolean;
  connect(source: AudioNode): AudioNode;
  disconnect(): void;
  getInput(): AudioNode;
  getOutput(): AudioNode;
  setParam(name: string, value: number): void;
  getParam(name: string): number;
  getParams(): Record<string, EffectParam>;
  dispose(): void;
}

export interface EffectParam {
  value: number;
  min: number;
  max: number;
  step: number;
  label: string;
  unit?: string;
}

export interface AudioFileInfo {
  name: string;
  duration: number;
  sampleRate: number;
  numberOfChannels: number;
  buffer: AudioBuffer;
}

export type PlaybackState = "idle" | "playing" | "paused";

export interface EffectConfig {
  speed: number;
  reverb: number;
  bassBoost: number;
  pitch: number;
}

export const DEFAULT_EFFECT_CONFIG: EffectConfig = {
  speed: 0.85,
  reverb: 0.5,
  bassBoost: 0.4,
  pitch: 0,
};
