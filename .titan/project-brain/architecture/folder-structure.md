# Folder Structure

> This will be populated once the Creator locks the project shape and scaffolding begins.

## Planned Structure (Tentative)
```
peak-and-peak-studio/
├── .github/
│   ├── agents/              # Project-specific agents + subagents
│   ├── instructions/        # Stack-matched skills/instructions
│   └── copilot-instructions.md
├── .titan/
│   ├── project-brain/       # Project knowledge base
│   └── version.txt
├── .titan-dashboard/        # Project dashboard (gitignored)
├── src/
│   ├── app/                 # Next.js App Router pages
│   ├── components/          # Page-specific components
│   ├── lib/
│   │   ├── audio/           # Web Audio engine
│   │   │   ├── effects/     # Individual effect modules
│   │   │   ├── engine.ts    # AudioContext + chain management
│   │   │   └── types.ts     # Audio-related type definitions
│   │   └── utils/           # General utilities
│   ├── stores/              # Zustand stores
│   ├── ui-kit/              # Reusable UI components
│   │   ├── primitives/
│   │   ├── layout/
│   │   ├── feedback/
│   │   ├── forms/
│   │   ├── audio/           # Audio-specific UI (knobs, sliders, meters)
│   │   └── index.ts
│   └── theme/               # Design tokens and theme system
├── public/                  # Static assets (impulse responses, etc.)
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.ts
```

## Notes
- Final structure will be confirmed during Creator intake
- Audio-specific UI components get their own `ui-kit/audio/` category
- Impulse response files for reverb effects go in `public/ir/`
