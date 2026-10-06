# FileRow
Purpose: row in a bordered list showing an added source: icon, name, subtitle, Badge (dot), remove IconButton.

## Tokens
row padding 7px --space-10; separator --color-line-row; container border --color-line radius --radius-8 bg --color-card overflow hidden; name 12.5/500; subtitle --type-small --color-mute; trailing gap --space-6; remove IconButton sm 28.

## Props
```ts
interface FileRowProps { icon: ReactNode; name: string; subtitle: string; status: ReactNode; removeLabel: string; onRemove: () => void }
```

## Accessibility
List semantics (ul/li); remove has aria-label with file name.

## States
Not on the revised DS-Display page; rules below follow the designer's global answers. Last row without separator. Remove IconButton is sm 28 (`--size-control-sm`). Hover: UNDESIGNED (proposal `--color-soft` bg). Focus: ring drawn inset on the row and on the remove button (list-row rule). Disabled (while removing): 45% opacity, no hover or focus, `cursor: not-allowed`. Error and uploading: UNDESIGNED, proposal Badge err / warn in the status slot.

## Light/dark
Token-driven.

## Used by
WizardFrame (Added list). Section wrapper: Card-like block (--color-card, radius --radius-12, border, padding --space-14, gap --space-10) with h3 title and optional select.

## Differs from current web
New.
