<p align="center">
  <img src=".github/assets/logo-ascii.png" width="144" height="144" alt="Peak's original pink EQ bars converted to ASCII">
</p>

<h1 align="center">Peak &amp; Peak Studio</h1>

<p align="center"><strong>Slow it down. Give it space.</strong></p>

<p align="center">
  <a href="#use-the-studio"><img src="https://img.shields.io/badge/status-STABLE-ff2d55?style=flat-square&amp;labelColor=161b22" alt="Stable"></a>
  <a href="package.json"><img src="https://img.shields.io/badge/TypeScript-ff2d55?style=flat-square&amp;labelColor=161b22" alt="TypeScript"></a>
  <a href="src/lib/audio/engine.ts"><img src="https://img.shields.io/badge/Web_Audio-ff2d55?style=flat-square&amp;labelColor=161b22" alt="Web Audio"></a>
</p>

<p align="center">
  <a href="#run-locally"><strong>Run the studio →</strong></a> &nbsp; · &nbsp;
  <a href="#use-the-studio">How it works</a> &nbsp; · &nbsp;
  <a href="https://github.com/Hot-Sweeper/peak-and-peak-studio/issues">Feedback</a>
</p>

---

A **stable** browser audio studio for slowed playback, reverb, bass boost, and pitch controls. Load a track, shape its sound, and export a WAV file. Audio processing happens on your device; your tracks are not uploaded to a server.

## Highlights

- Slowed playback and reverb controls
- Bass boost and pitch controls
- Waveform visualization and playback controls
- A local track library backed by IndexedDB
- WAV export using browser audio processing
- No account or audio upload required

## Use the studio

1. Open the app and go to `/studio`.
2. Choose an audio file your browser can decode.
3. Adjust speed, reverb, bass boost, and pitch.
4. Play your track, then use **Export Master** to save a WAV file.

Your browser's audio support determines which file formats it can open. The library is stored locally in that browser; clearing site data removes the stored library.

## Run locally

Requirements: Node.js 20.9 or newer, npm, and Git.

```bash
git clone https://github.com/Hot-Sweeper/peak-and-peak-studio.git
cd peak-and-peak-studio
npm ci
npm run dev
```

Open [localhost:3000](http://localhost:3000), then choose **Open Studio**.

## Production build

```bash
npm run build
npm start
```

The repository includes Railway configuration for building and running the app. No API keys or secrets are needed for its client-side audio workflow.

## Stack

TypeScript · React · Next.js · Tailwind CSS · Web Audio API · Zustand · IndexedDB

## Project structure

```text
src/app/           Landing page and studio
src/components/    Audio controls, waveform, library, and layout
src/lib/audio/     Playback, effects, and background audio
src/lib/db/        Local library storage
src/stores/        Audio and library state
```

## Feedback

Report bugs or suggest improvements through [GitHub Issues](https://github.com/Hot-Sweeper/peak-and-peak-studio/issues). Include your browser, operating system, and steps to reproduce the issue.

---

<p align="center"><sub>Built by <a href="https://github.com/Hot-Sweeper">Mr. Lemon</a> · <a href="https://github.com/Hot-Sweeper/still-browser">Still Browser: experimental alpha</a></sub></p>
