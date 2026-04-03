import type { EffectNode, EffectParam } from "../types";

export class BassBoostEffect implements EffectNode {
  readonly name = "bassBoost";
  enabled = true;

  private ctx: AudioContext;
  private filter: BiquadFilterNode;
  private inputNode: GainNode;
  private outputNode: GainNode;
  private gain = 10;

  constructor(ctx: AudioContext) {
    this.ctx = ctx;
    this.inputNode = ctx.createGain();
    this.outputNode = ctx.createGain();
    this.filter = ctx.createBiquadFilter();
    this.filter.type = "lowshelf";
    this.filter.frequency.value = 200;

    this.inputNode.connect(this.filter);
    this.filter.connect(this.outputNode);
    this.setParam("gain", this.gain);
  }

  connect(source: AudioNode): AudioNode {
    source.connect(this.inputNode);
    return this.outputNode;
  }

  disconnect(): void {
    this.inputNode.disconnect();
    this.outputNode.disconnect();
  }

  getInput(): AudioNode {
    return this.inputNode;
  }

  getOutput(): AudioNode {
    return this.outputNode;
  }

  setParam(name: string, value: number): void {
    if (name === "gain") {
      this.gain = value;
      this.filter.gain.setValueAtTime(value, this.ctx.currentTime);
    }
  }

  getParam(name: string): number {
    if (name === "gain") return this.gain;
    return 0;
  }

  getParams(): Record<string, EffectParam> {
    return {
      gain: {
        value: this.gain,
        min: 0,
        max: 24,
        step: 0.5,
        label: "Bass Boost",
        unit: "dB",
      },
    };
  }

  dispose(): void {
    this.disconnect();
    this.filter.disconnect();
  }
}
