"use client";

import { Sparkles } from "lucide-react";
import clsx from "clsx";
import {
  useLibraryStore,
  DEFAULT_DYNAMIC_SPEED_MIN,
  DEFAULT_DYNAMIC_SPEED_MAX,
} from "@/stores/library-store";
import { useAudioStore } from "@/stores/audio-store";

export function DynamicModeControls() {
  const {
    isDynamicMode,
    dynamicSpeedMin,
    dynamicSpeedMax,
    toggleDynamicMode,
    setDynamicSpeedRange,
  } = useLibraryStore();
  const applyDynamicSpeedIfEnabled = useAudioStore((s) => s.applyDynamicSpeedIfEnabled);

  const handleToggle = () => {
    const enabling = !isDynamicMode;
    toggleDynamicMode();
    if (enabling) applyDynamicSpeedIfEnabled();
  };

  return (
    <div className="w-full bg-bg-elevated rounded-[24px] p-5 shadow-glass border border-border-glass mb-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Sparkles className="w-5 h-5 text-accent shrink-0" aria-hidden="true" />
          <div className="min-w-0">
            <p className="text-white/90 font-medium text-[15px]">Dynamic Play</p>
            <p className="text-white/40 text-xs mt-0.5 leading-snug">
              Smart random queue — no repeats until all tracks play
            </p>
          </div>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={isDynamicMode}
          aria-label="Toggle dynamic play mode"
          onClick={handleToggle}
          className={clsx(
            "relative w-12 h-7 rounded-full transition-colors shrink-0 cursor-pointer",
            isDynamicMode ? "bg-accent" : "bg-white/15"
          )}
        >
          <span
            className={clsx(
              "absolute top-1 left-1 w-5 h-5 rounded-full bg-white shadow transition-transform",
              isDynamicMode && "translate-x-5"
            )}
          />
        </button>
      </div>

      {isDynamicMode && (
        <div className="mt-5 pt-5 border-t border-white/10 space-y-4">
          <p className="text-white/50 text-xs uppercase tracking-wider font-semibold">
            Random speed range
          </p>
          <RangeField
            label="Min speed"
            value={dynamicSpeedMin}
            min={0.5}
            max={1.5}
            step={0.01}
            onChange={(min) => setDynamicSpeedRange(min, dynamicSpeedMax)}
          />
          <RangeField
            label="Max speed"
            value={dynamicSpeedMax}
            min={0.5}
            max={1.5}
            step={0.01}
            onChange={(max) => setDynamicSpeedRange(dynamicSpeedMin, max)}
          />
          <p className="text-white/30 text-[11px]">
            Default {DEFAULT_DYNAMIC_SPEED_MIN}x – {DEFAULT_DYNAMIC_SPEED_MAX}x · updates on each track change
          </p>
        </div>
      )}
    </div>
  );
}

function RangeField({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}) {
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <label className="text-white/70 text-sm" htmlFor={`dynamic-${label}`}>
          {label}
        </label>
        <span className="text-white/40 text-[13px] font-mono tabular-nums bg-white/5 px-2 py-0.5 rounded-md">
          {value.toFixed(2)}x
        </span>
      </div>
      <input
        id={`dynamic-${label}`}
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
      />
    </div>
  );
}
