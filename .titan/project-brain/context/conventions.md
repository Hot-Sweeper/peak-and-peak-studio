# Coding Conventions

## General
- **Language:** TypeScript (strict mode)
- **File naming:** kebab-case for files, PascalCase for React components
- **Imports:** Absolute imports via `@/` alias
- **No emoji in code or UI** — use SVG icons from Lucide React
- **No hardcoded colors** — always use theme tokens / CSS variables
- **Comments:** Explain WHY, not WHAT — code should be self-explanatory

## React / Next.js
- Use App Router (`app/` directory)
- Server Components by default; `'use client'` only when needed (audio, interactivity)
- Colocate page-specific components near their route
- Shared components in `src/ui-kit/`

## State Management
- Zustand for global audio engine state (current track, effects, playback)
- React local state for component-level UI (dropdowns, modals, hover)

## Audio Code
- All Web Audio logic in `src/lib/audio/`
- Each effect is a self-contained module in `src/lib/audio/effects/`
- Standard effect interface: `create()`, `connect()`, `disconnect()`, `setParam()`, `getParam()`
- Always clean up audio nodes on unmount

## Styling
- Tailwind CSS v4 with CSS variables for theming
- Dark-first design aesthetic
- Mobile-first responsive approach
- No inline styles — use Tailwind utilities or theme tokens

## Testing
- Vitest for unit tests
- Playwright for E2E tests (if needed)
- Test audio logic separately from UI components

## Git
- `dev` branch for staging, `main` for production
- Meaningful commit messages
- Tag before major features
