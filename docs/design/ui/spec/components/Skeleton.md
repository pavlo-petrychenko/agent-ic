# Skeleton
Purpose: loading placeholder lines.

## Anatomy
stack (gap `--space-6`, default width 160 in the demo) > bars, radius `--radius-4`: title bar 12px high bg `--color-chip` at 70% width; text bar 8px high bg `--color-soft` at 100% width.

## States
Static as drawn. UNDESIGNED: animation (DS-Patterns gives no pulse for skeletons; it gives 1.2s only for the typing dots). Proposal: opacity pulse over 1200ms (`--duration-pulse` proposal), none under `prefers-reduced-motion`. No disabled or hover.
Delay (drawn rule, DS-Patterns > Page states): show skeletons only if loading takes more than 300ms (`SKELETON_DELAY_MS = 300`, component-local), matching the real layout; navigation stays usable while a page loads.

## Layouts drawn on DS-Patterns
All bars radius `--radius-4`; emphasis bars `--color-chip`, the rest `--color-soft` (same two colours as above).
- page (Page states > "page loading"): grid 180 + 1fr, gap `--space-12`, padding `--space-12`, bg `--color-bg`, border `--color-line`, radius `--radius-10` (520 wide sample). List column: 4 rows (gap `--space-10`), each a 28x28 square (radius 4, soft) + two lines (gap 5): 9px chip at 70%, 7px soft at 50%. Content column (gap `--space-10`): heading 14px chip at 40%, line 9px soft at 60%, block 90px soft at 100%, block 40px soft at 100%.
- table rows (Table > "loading · skeleton rows"): 3 rows, header row kept; row padding `--space-14`, same grid as data rows; checkbox 16 (radius 4, soft), tile 28 (radius 4, soft), lines 10px chip at 60% and 8px soft at 80% (gap 6), badge 70x18 soft, numeric cells 10px soft at 100%.
The v2 bar heights 12 and 8 are joined by 7, 9, 10 and 14, plus square and block shapes.

## Props
```ts
type SkeletonProps = { lines: { width: string; height: 7 | 8 | 9 | 10 | 12 | 14; tone: 'strong' | 'soft' }[]; width: string | null }
type SkeletonBoxProps = { width: string; height: string; tone: 'strong' | 'soft' }
```

## Accessibility
Container `aria-busy="true"` with a visually-hidden "Loading"; bars `aria-hidden`. No Radix.

## Light/dark
Token-driven; `--color-chip` stays visibly darker than `--color-soft` in both themes.

## Used by
Lists and cards while data loads; page loading (Page states); Table loading rows.
