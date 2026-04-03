# System Design

## Architecture Overview
Peak and Peak Studio is a client-heavy web application. Audio processing happens entirely in the browser using the Web Audio API. The server (Next.js) handles routing, metadata, and static asset serving.

## High-Level Architecture
```
[Browser Client]
  |-- Next.js App Router (pages, layouts, metadata)
  |-- React Components (UI layer)
  |-- Audio Engine (Web Audio API)
  |     |-- AudioContext management
  |     |-- Effect chain (source -> effects -> destination)
  |     |-- Offline rendering for export
  |-- State Management (Zustand)
  |-- Theme System (CSS variables + Tailwind)

[Server]
  |-- Next.js API routes (if needed for file conversion, etc.)
  |-- Static asset serving
```

## Audio Processing Chain
```
[Audio Source (file buffer)]
  -> [Playback Rate (slow/speed)]
  -> [Pitch Shifter]
  -> [Reverb (ConvolverNode)]
  -> [Bass Boost (BiquadFilter)]
  -> [Echo (DelayNode + feedback)]
  -> [Master Gain]
  -> [Analyser (visualization)]
  -> [Destination (speakers)]
```

## Key Architectural Decisions
- Audio processing is 100% client-side (no server audio processing)
- Each effect is a self-contained module with a standard interface
- Effects can be enabled/disabled independently and reordered
- OfflineAudioContext used for export rendering
- State is managed by Zustand (audio engine state) + React (UI state)
