# Patterns & Insights

> Patterns discovered during development. Things that worked well, approaches to remember.

## Discovered Patterns
None yet. Will be populated as development progresses.

## Web Audio API Patterns to Remember
- Always create AudioContext after user gesture (autoplay policy)
- Use `OfflineAudioContext` for non-real-time rendering/export
- Disconnect nodes when removing effects from chain
- ConvolverNode needs an AudioBuffer (impulse response) — load async
- BiquadFilterNode for EQ-style effects (lowshelf, highshelf, peaking)
- DelayNode + GainNode feedback loop for echo/delay effects
