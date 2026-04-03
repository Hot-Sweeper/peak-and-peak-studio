import type { EffectNode, EffectParam } from "../types";

export class ReverbEffect implements EffectNode {
  readonly name = "reverb";
  enabled = true;

  private ctx: AudioContext;
  private convolver: ConvolverNode;
  private dryGain: GainNode;
  private wetGain: GainNode;
  private inputNode: GainNode;
  private outputNode: GainNode;
  private mix = 0.5;

  constructor(ctx: AudioContext) {
    this.ctx = ctx;
    this.inputNode = ctx.createGain();
    this.outputNode = ctx.createGain();
    this.convolver = ctx.createConvolver();
    this.dryGain = ctx.createGain();
    this.wetGain = ctx.createGain();

    this.inputNode.connect(this.dryGain);
    this.inputNode.connect(this.convolver);
    this.convolver.connect(this.wetGain);
    this.dryGain.connect(this.outputNode);
    this.wetGain.connect(this.outputNode);

    this.setParam("mix", this.mix);
    this.generateImpulseResponse(2.5, 2.0);
  }

  private generateImpulseResponse(duration: number, decay: number) {
    const length = this.ctx.sampleRate * duration;
    const impulse = this.ctx.createBuffer(2, length, this.ctx.sampleRate);

    for (let channel = 0; channel < 2; channel++) {
      const data = impulse.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
      }
    }

    this.convolver.buffer = impulse;
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
    if (name === "mix") {
      this.mix = value;
      const now = this.ctx.currentTime;
      this.wetGain.gain.setValueAtTime(value, now);
      this.dryGain.gain.setValueAtTime(1 - value, now);
    }
  }

  getParam(name: string): number {
    if (name === "mix") return this.mix;
    return 0;
  }

  getParams(): Record<string, EffectParam> {
    return {
      mix: {
        value: this.mix,
        min: 0,
        max: 1,
        step: 0.01,
        label: "Reverb",
        unit: "%",
      },
    };
  }

  dispose(): void {
    this.disconnect();
    this.convolver.disconnect();
    this.dryGain.disconnect();
    this.wetGain.disconnect();
  }
}
