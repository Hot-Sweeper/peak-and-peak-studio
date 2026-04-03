# Changelog

> What was built and when. Updated by the Titan after every change.

## April 2026

### [2026-04-03] Core MVP Built
- Built audio engine with effect chain orchestration (`src/lib/audio/engine.ts`)
- Created reverb effect (ConvolverNode + generated impulse response, wet/dry mix)
- Created bass boost effect (BiquadFilterNode lowshelf @ 200Hz)
- Speed control via AudioBufferSourceNode.playbackRate
- Pitch shift via detune parameter (semitones)
- Zustand audio store with full playback lifecycle
- WAV export using OfflineAudioContext + manual WAV encoder
- Upload zone with drag & drop, file picker, type/size validation
- Waveform visualizer (static buffer render + live analyser animation)
- Playback controls (play/pause/stop/reset effects)
- Effect control sliders (speed, reverb, bass boost, pitch)
- Export button with loading spinner
- Full liquid/glassy dark theme with CSS variables (@theme)
- Range input custom styling (thumb glow, track fill)
- Accessible: skip link, ARIA labels, keyboard nav, focus-visible, forced-colors

### [2026-04-03] Creator Intake Complete
- Locked build mode: solid reusable codebase
- Locked feature scope: core effects MVP (slow, reverb, pitch, speed, bass boost, export)
- Locked design direction: liquid/glassy aesthetic on dark backgrounds
- Locked agent autonomy: high (decide defaults, show results)
- Updated project overview, user preferences, and current phase
- Project is ready for Peak Titan implementation

### [2026-04-03] Code Titan v2 Bootstrap
- Installed Code Titan v2 agent
- Created Peak Creator, Peak Titan, Peak Planner agents
- Created 7 specialist subagents (debugger, performance-optimizer, security-auditor, api-integrator, brainstormer, project-organizer, ui-ux-perfectionist)
- Downloaded 10 stack-matched skills/instructions
- Scaffolded project brain structure
- Set up project dashboard template
- Created `.github/copilot-instructions.md`
