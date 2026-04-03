"use client";

import { useEffect, useRef } from "react";
import { useAudioStore } from "@/stores/audio-store";

export function WaveformVisualizer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engine = useAudioStore((s) => s.engine);
  const playbackState = useAudioStore((s) => s.playbackState);
  const fileInfo = useAudioStore((s) => s.fileInfo);
  const animRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !fileInfo) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;

    const drawStatic = () => {
      ctx.clearRect(0, 0, width, height);

      const data = fileInfo.buffer.getChannelData(0);
      const step = Math.ceil(data.length / width);
      const midY = height / 2;

      ctx.beginPath();
      ctx.strokeStyle = "rgba(255, 45, 85, 0.4)";
      ctx.lineWidth = 1;

      for (let i = 0; i < width; i++) {
        let min = 1.0;
        let max = -1.0;
        for (let j = 0; j < step; j++) {
          const sample = data[i * step + j];
          if (sample !== undefined) {
            if (sample < min) min = sample;
            if (sample > max) max = sample;
          }
        }
        ctx.moveTo(i, midY + min * midY);
        ctx.lineTo(i, midY + max * midY);
      }
      ctx.stroke();
    };

    const drawLive = () => {
      const analyser = engine.getAnalyser();
      if (!analyser) {
        drawStatic();
        return;
      }

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const render = () => {
        analyser.getByteTimeDomainData(dataArray);

        ctx.clearRect(0, 0, width, height);

        // Draw static waveform as background
        const data = fileInfo.buffer.getChannelData(0);
        const step = Math.ceil(data.length / width);
        const midY = height / 2;

        ctx.beginPath();
        ctx.strokeStyle = "rgba(255, 45, 85, 0.2)";
        ctx.lineWidth = 1;

        for (let i = 0; i < width; i++) {
          let min = 1.0;
          let max = -1.0;
          for (let j = 0; j < step; j++) {
            const sample = data[i * step + j];
            if (sample !== undefined) {
              if (sample < min) min = sample;
              if (sample > max) max = sample;
            }
          }
          ctx.moveTo(i, midY + min * midY);
          ctx.lineTo(i, midY + max * midY);
        }
        ctx.stroke();

        // Draw live waveform overlay
        ctx.beginPath();
        ctx.strokeStyle = "#ff2d55";
        ctx.lineWidth = 2.5;
        const sliceWidth = width / bufferLength;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const v = dataArray[i] / 128.0;
          const y = (v * height) / 2;
          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
          x += sliceWidth;
        }
        ctx.stroke();

        if (playbackState === "playing") {
          animRef.current = requestAnimationFrame(render);
        }
      };

      render();
    };

    if (playbackState === "playing") {
      drawLive();
    } else {
      drawStatic();
    }

    return () => {
      if (animRef.current !== null) {
        cancelAnimationFrame(animRef.current);
      }
    };
  }, [engine, playbackState, fileInfo]);

    if (!fileInfo) return null;

  return (
    <div className="w-full h-full flex items-center justify-center p-2" role="img" aria-label="Audio waveform visualization">
      <canvas
        ref={canvasRef}
        className="w-full h-full max-h-[140px]"
        aria-hidden="true"
      />
    </div>
  );
}
