"use client";

import { useAudioStore } from "@/stores/audio-store";
import { Music, Waves, Speaker, ArrowDownUp } from "lucide-react";

const EFFECT_DEFS = [
  {
    key: "speed" as const,
    label: "Speed",
    icon: Music,
    min: 0.5,
    max: 1.5,
    step: 0.01,
    format: (v: number) => `${v.toFixed(2)}x`,
  },
  {
    key: "reverb" as const,
    label: "Reverb",
    icon: Waves,
    min: 0,
    max: 1,
    step: 0.01,
    format: (v: number) => `${Math.round(v * 100)}%`,
  },
  {
    key: "bassBoost" as const,
    label: "Bass Boost",
    icon: Speaker,
    min: 0,
    max: 1,
    step: 0.01,
    format: (v: number) => `${Math.round(v * 100)}%`,
  },
  {
    key: "pitch" as const,
    label: "Pitch",
    icon: ArrowDownUp,
    min: -12,
    max: 12,
    step: 1,
    format: (v: number) => `${v > 0 ? "+" : ""}${v} st`,
  },
] as const;

export function EffectControls() {
  const config = useAudioStore((s) => s.config);
  const setConfig = useAudioStore((s) => s.setConfig);
  const fileInfo = useAudioStore((s) => s.fileInfo);

  if (!fileInfo) return null;

  return (
    <div className="w-full bg-bg-elevated rounded-[24px] p-5 shadow-glass border border-border-glass" role="group" aria-label="Audio effect controls">
      <div className="space-y-4">
        {EFFECT_DEFS.map((def) => (
          <EffectSlider
            key={def.key}
            icon={<def.icon className="w-5 h-5 text-white/50 group-hover:text-accent transition-colors" aria-hidden="true" />}
            label={def.label}
            value={config[def.key]}
            min={def.min}
            max={def.max}
            step={def.step}
            displayValue={def.format(config[def.key])}
            onChange={(v) => setConfig({ [def.key]: v })}
          />
        ))}
      </div>
    </div>
  );
}

function EffectSlider({
  icon,
  label,
  value,
  min,
  max,
  step,
  displayValue,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  displayValue: string;
  onChange: (value: number) => void;
}) {
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className="group space-y-1">
      <div className="flex items-center justify-between pb-1">
        <div className="flex items-center gap-3">
          {icon}
          <label className="text-white/80 font-medium text-[15px]" htmlFor={`effect-${label}`}>
            {label}
          </label>
        </div>
        <span className="text-white/40 text-[13px] font-mono tabular-nums bg-white/5 px-2 py-0.5 rounded-md">
          {displayValue}
        </span>
      </div>
      <div className="pt-2">
        <input
          id={`effect-${label}`}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer border-none"
          style={{
            background: `linear-gradient(to right, var(--color-accent) 0%, var(--color-accent) ${percentage}%, rgba(255,255,255,0.1) ${percentage}%, rgba(255,255,255,0.1) 100%)`,
          }}
          aria-label={`${label}: ${displayValue}`}
        />
      </div>
    </div>
  );
}
