# TreeFolder
Purpose: collapsible group header in a sub-navigation tree (`tree_folder`), children are SubnavItem depth 1.

## Anatomy
Button: chevron icon | label (weight 600). Children below, gap 1px.

## Variants / sizes
Height 30px (list-row height, not a control; stays 30 on the page), padding 0 10px, gap --space-8. Label --type-body weight 600 color --color-ink-secondary; chevron color --color-mute.

## States
open (`aria-expanded="true"`, icon `chevron-down`, children visible); closed (`chevron-right`, hidden); icons renamed from chev/chevr. focus-visible: inset 2px accent ring (`--shadow-focus-ring-inset`). disabled: 45%, no hover/focus, not-allowed. hover: UNDESIGNED (proposal --color-soft).

## Props
```ts
type TreeFolderProps = { label: string; open: boolean; onOpenChange: (open: boolean) => void; children: ReactNode };
```

## Accessibility
Button with `aria-expanded`, `aria-controls`. Radix Collapsible fits (inside shared/ui only). Tree role not necessary for two levels; if full tree: `role="tree"`, Arrow keys.

## Light/dark
Token-driven.

## Used by
DS-Data: "Booking" folder with Receptionist and Write confirmation (agent versions/prompts).
