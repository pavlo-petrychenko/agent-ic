# Inspector
Purpose: right-hand property editor for the selected flow node, with kind label, title, close button and titled sections.

## Anatomy
aside > InspectorHead (kicker with icon, h2, subtitle, close IconButton sm 28) | InspectorBody > InspectorSection[] (h3 + right note + controls).

## Variants / sizes
Width 320 (`--size-inspector-width`, shared with Inbox details). Kicker colour follows node kind (sample: Send message, ok green, icon `send` 12).
Responsive: viewport >= 1280 it is a docked column (stays 320 while the content column shrinks); 1024-1279 it becomes a 320 Drawer over the canvas (opens on node select, closes on Escape, close button, or selecting empty canvas). Drawn on DS-Patterns > Responsive: at 1440 and 1280 the inspector is a docked 320 column and only the canvas shrinks (Rail 56 and palette 232 stay); at 1024 it is a 320 drawer over the canvas, below the Topbar, with `--shadow-popover`, closed by ✕ or Esc.

## States
Controls inside own states. Close button: hover bg `--color-soft`, focus-visible `--shadow-focus-ring`. Open (as a drawer): slide from the right, `--duration-slow` `--ease-enter`; docked: no animation.

## Props
```ts
interface InspectorProps { kind: { label: string; icon: ReactNode; tone: StatusTone }; title: string; subtitle: string | null; closeLabel: string; onClose: () => void; children: ReactNode }
interface InspectorSectionProps { title: string; note: string | null; children: ReactNode }
```

## Tokens
bg `--color-panel`; head padding `--space-14` `--space-20` `--space-12`, border-bottom `--color-line`, gap `--space-4`; kicker `--type-overline` uppercase `--tracking-overline` in the kind colour (sample `--color-ok`); title `--type-h2` (18/600); subtitle `--type-caption` `--color-mute`; body padding `--space-14` `--space-20`, gap `--space-14`; section gap `--space-7`; section title `--type-caption-strong` (12/600) `--color-ink-secondary`; note `--type-hint` `--color-mute`; close 28 (`--size-control-sm`); variable chip bg `--color-accent-light` color `--color-accent-dark` radius `--radius-4` mono `--type-mono`; value box padding `--space-8` `--space-10` border `--color-line` radius `--radius-8` bg `--color-card`; drawer form: z `--z-drawer`.

## Accessibility
aside labelled by title; close returns focus to the selected node; as a drawer it behaves like a non-modal complementary region (no focus trap; Escape closes). Switch uses role=switch (Radix Switch).

## Light/dark
Token-driven; the chip tint has dark values in the accent-light/accent-dark tokens.

## Used by
DS-Navigation (Inspector). Flow builder.

## Differs from current web
New. VariableChip first appears here.
