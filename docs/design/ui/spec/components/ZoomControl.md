# ZoomControl
Purpose: canvas zoom out / percent / zoom in / Fit toolbar.
Anatomy: bar h34, border, radius 8, bg card; icon buttons 28x28 (`minus`/`plus`, small controls are 28), percent label 12px, 1px divider, "Fit" text button pad 0 10, height 28 (decided; the page draws 32), inside the 34 bar.
States: default. focus-visible: outside 2px-gap ring (`--shadow-focus-ring`) per button (ring sits outside the bar, bar not clipped). disabled (at min/max): normal colours at 45% opacity, no hover/focus, not-allowed (designer's single rule). hover (decided): bg `--color-soft`.
Props: `{ zoom: number; onZoomIn; onZoomOut; onFit; min; max }`. Range 25–200% (drawn rule, DS-Patterns > Canvas interactions: "⌘ + wheel zooms (25–200%)"): min 0.25, max 2; the buttons disable at the ends.
Tokens: `--size-control-md` (34), `--size-control-sm` (28), `--color-card`, `--color-line` (border and divider), `--radius-8`, icon `--color-mute`, label `--color-ink-secondary`, Fit `--color-ink`, `--type-caption`.
A11y: role=toolbar, aria-labels "Zoom out/in", keyboard arrows within; percent aria-live=polite. Radix Toolbar fits (only in shared/ui).
Light/dark: tokens swap. Responsive: stays docked bottom-left; inspector drawer opens on the right.
Used: DS-Flow-Chat (twice: canvas and parts).
