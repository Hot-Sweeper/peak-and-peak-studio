# Peak Studio design notes

Read this before visual changes. Update it when a decision below changes on purpose.

## Identity

Dark, music-player feel: pure black base, soft glass surfaces, one hot pink-red accent. The logo is three pink EQ bars.

## Tokens

All colors, radii, shadows and blur live in `src/app/globals.css` under `@theme`.

- Base `#000`, elevated surface `#111` (`bg-bg-elevated`), glass `rgba(255,255,255,.05)`.
- Accent `#FF2D55` (`bg-accent`), hover `#ff4769`. Use it for the one primary action on a screen and for active states.
- Text: white, with opacity steps for hierarchy. Small text on `#111` stays at 50% white or stronger (AA contrast); 40% is only for disabled labels.
- Errors on dark surfaces use `#ff6b81`, which stays readable where the accent red would not.

## Shape

- Cards and sheets: 24 to 28 px radius, 1 px `border-border-glass`, no heavy shadows.
- Buttons are full pills. Primary: accent fill with `shadow-glow`. Secondary: `bg-white/10`, `hover:bg-white/15`. Quiet: text only with a faint hover fill.
- Segmented controls: pill track `bg-white/5` with an accent indicator that slides between options.
- Touch targets: at least 44 px tall.

## Type

System sans (`--font-sans`). Bold, tight headings. Codes and numbers that should not shift use `font-mono` or `tabular-nums`.

## Motion

Motion tokens are defined on `:root` in `globals.css`:

| Token | Use |
| --- | --- |
| `--ease-out` | Things entering (dialogs on desktop, backdrops) |
| `--ease-out-strong` | Press feedback, icon swaps |
| `--ease-in` | Things leaving for good, always shorter than the entrance |
| `--ease-in-out` | Something on screen moving (segment indicator) |
| `--ease-drawer` | Bottom sheets arriving on phones |
| `--ease-overshoot` | Small confirmations (copied badge, done check) |

Durations: press 120 ms, small 200 ms, medium 300 ms, large 420 ms.

- `.press` gives every button a 0.97 scale on pointer down.
- The transfer sheet slides up from the bottom on phones and scales in from 96% on wider screens.
- Progress bars track real bytes with a short linear transition. Never fake progress.
- Under `prefers-reduced-motion`, movement is removed and only opacity changes remain.
