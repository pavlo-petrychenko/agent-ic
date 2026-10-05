# SubnavItem
Purpose: compact sub-navigation row with label and trailing count or version (`subnav_item`).
Source (states): drawn on DS-States (light) and DS-Dark-States (dark; colours are the tokens.md dark values).

## Anatomy
Link: label left, trailing meta right (count in sans 11.5px, or version in mono 11px).

## Variants
- `indent`: 0 | 1 (padding-left 28px inside a TreeFolder).
- `meta`: `count` (`--type-small`) | `version` (`--type-mono-xs`).

## Sizes
Height 34 (`--size-control-md`), padding 0 10, radius `--radius-8`.

## States (drawn on DS-States / DS-Dark-States)
default weight 400; hover bg `--color-soft`; selected bg `--color-chip` + label weight 600 (meta stays 400 `--color-mute`); focus-visible inset ring `inset 0 0 0 2px --color-accent` (row in a list); disabled: global 45% rule. Drawn with the count meta (11.5 `--color-mute`).

## Props
```ts
type SubnavItemProps = { href: string; label: string; selected: boolean; disabled: boolean; meta: string | null; metaKind: 'count'|'version'; depth: 0|1 };
```

## Tokens
label `--type-body` `--color-ink`; meta `--color-mute`; selected `--color-chip`.

## Accessibility
`<a aria-current="page">`; part of a `nav`.

## Light/dark
Token-driven.

## Used by
DS-Data: Roles (4), API tokens (1), Receptionist v4, Write confirmation v2, Booking basics (18 cases), Escalations (6 cases). Not drawn on the Navigation page (spec kept from the DS-Data pass; re-check against the revised Data page).
