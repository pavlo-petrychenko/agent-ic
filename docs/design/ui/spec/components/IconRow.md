# IconRow
Purpose: single row: NodeTile 22 + label + trailing value (e.g. flow step outcome "-> yes").

## Anatomy
flex, centre, gap 8, 12.5px, min-width 0 > NodeTile 22 (tone, esc shown) + label + trailing (margin-left auto, `--type-mono-xs` 11, `--color-ink-secondary`).
Companion "stack": two-line text (title 13/600 `--color-ink`, muted 11.5px `--color-mute`, gap 3), used beside tiles; build as Text, not a component.

## States
Static, not interactive (demo sits in Card pad 12).

## Props
```ts
type IconRowProps = { tone: NodeKind; icon: IconName; label: string; trailing: ReactNode | null }
```

## Accessibility
Icon decorative. No Radix.

## Light/dark
Token-driven (tile hue pair).

## Used by
Flow step outcomes, run summaries.
