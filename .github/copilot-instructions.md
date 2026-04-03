# Peak and Peak Studio — Copilot Instructions

> These instructions are automatically loaded by VS Code for every Copilot chat in this workspace.

## Project
**Peak and Peak Studio** — A browser-based slowed & reverb audio effects studio. Users upload audio and apply real-time effects (slow, reverb, bass boost, pitch shift, echo) directly in the browser.

## Tech Stack
- Next.js 15 (App Router) + React 19 + TypeScript (strict)
- Tailwind CSS v4 (dark-first, CSS variables for theming)
- Web Audio API (client-side audio processing)
- Zustand (state management)
- Lucide React (icons — no emoji)

## Key Rules
1. **Always read `.titan/project-brain/INDEX.md` first** — it tells you what to load for any task
2. **No hardcoded colors** — use theme tokens / CSS variables only
3. **No emoji in code or UI** — use SVG icons from Lucide React
4. **Audio code lives in `src/lib/audio/`** — never scatter Web Audio logic in components
5. **Check `src/ui-kit/` before building UI** — reuse existing components
6. **Check `modules/module-registry.md` before creating new modules** — avoid duplication
7. **Dark-first design** — music production aesthetic, not generic SaaS
8. **Use royalty-free stock images** (Unsplash, Pexels) for visual areas

## Project Agents
- **Peak Creator** (`peak-creator.agent.md`) — Project setup and evolution
- **Peak Titan** (`peak-titan.agent.md`) — Elite builder, the main implementation agent
- **Peak Planner** (`peak-planner.agent.md`) — Strategic planning before features

## Conventions
- File naming: kebab-case for files, PascalCase for components
- Absolute imports via `@/` alias
- `'use client'` only for interactive/audio components
- Server Components for layout, metadata, static content
