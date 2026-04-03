# Module Registry

> All reusable modules and their locations. Check this before creating anything new.

## Registered Modules

| Module | Path | Purpose | Status |
|--------|------|---------|--------|
| Audio Types | `src/lib/audio/types.ts` | EffectNode interface, EffectParam, AudioFileInfo, PlaybackState, EffectConfig | Built |
| Audio Engine | `src/lib/audio/engine.ts` | AudioContext lifecycle, effect chain, playback, WAV export | Built |
| Reverb Effect | `src/lib/audio/effects/reverb.ts` | ConvolverNode with generated impulse response, wet/dry mix | Built |
| Bass Boost Effect | `src/lib/audio/effects/bass-boost.ts` | BiquadFilterNode lowshelf @ 200Hz | Built |
| Effects Index | `src/lib/audio/effects/index.ts` | Barrel export for all effects | Built |
| Audio Store | `src/stores/audio-store.ts` | Zustand store — playback, config, export | Built |
| Upload Zone | `src/components/upload-zone.tsx` | Drag & drop + file picker for audio files | Built |
| Waveform Viz | `src/components/waveform-visualizer.tsx` | Canvas waveform (static + live) | Built |
| Playback Controls | `src/components/playback-controls.tsx` | Play/pause/stop/reset buttons + progress bar | Built |
| Effect Controls | `src/components/effect-controls.tsx` | Slider panel for speed, reverb, bass, pitch | Built |
| Export Button | `src/components/export-button.tsx` | WAV export trigger with loading state | Built |
| Studio Page | `src/app/page.tsx` | Main page layout composing all components | Built |
| Theme | `src/app/globals.css` | Liquid/glassy dark design tokens via @theme | Built |
| Root Layout | `src/app/layout.tsx` | HTML shell, metadata, skip link | Built |

### Expected Module Categories
| Category | Path | Purpose |
|----------|------|---------|
| Audio Engine | `src/lib/audio/engine.ts` | AudioContext management, chain orchestration |
| Audio Effects | `src/lib/audio/effects/` | Individual effect modules (reverb, slow, bass, etc.) |
| Audio Types | `src/lib/audio/types.ts` | Shared type definitions for audio system |
| UI Kit | `src/ui-kit/` | Reusable UI components |
| Audio UI | `src/ui-kit/audio/` | Audio-specific UI (knobs, sliders, meters, waveforms) |
| Theme | `src/theme/` | Design tokens and theme system |
| Stores | `src/stores/` | Zustand state stores |
