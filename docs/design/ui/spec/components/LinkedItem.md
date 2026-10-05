# LinkedItem
Purpose: dashed, row-shaped link to a related record, e.g. "Started linked run create_booking succeeded" in a trace. (Was wrongly aliased to LinkCard.)

## Anatomy
`a` root (flex, centre, gap 8, padding 10px 12px, border 1px dashed `--color-line-dash`, radius `--radius-8`, 12.5px, `--color-ink`, no underline) > NodeTile 22 (dark kind, tool-event icon) + sentence (strong part for the outcome) + chevron-right icon (margin-left auto, `--color-mute`).

## States
- default: as above. hover (decided): border colour `--color-line-node`, bg `--color-soft`.
- focus-visible: ring outside the element, 2px gap (it is a standalone item, not a list row).
- disabled: 45% opacity, no hover or focus, `cursor: not-allowed`.

## Props
```ts
type LinkedItemProps = { to: string; children: ReactNode; icon?: IconName; kind?: NodeKind; disabled?: boolean };
```

## Accessibility
Single link whose name is the sentence; chevron `aria-hidden`. Built with TanStack Router `createLink` (`to`), tile defaults to the dark `trig` kind with the `tool-event` icon. No Radix.

## Light/dark
Token-driven.

## Used by
Trace and run detail (linked runs).
