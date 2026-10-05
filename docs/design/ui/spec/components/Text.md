# Text
Purpose: body, secondary and caption text with a token-based kind and colour.

## Kinds
body `--type-body` (13/400, default colour ink-secondary); title `--type-title` (13/600, ink); lead `--type-lead` (14); small `--type-small` (11.5); caption `--type-caption` (12, mute); bodySmall `--type-body-small` (12.5); mono `--type-mono`; micro `--type-micro`; overline `--type-overline`.
Colour: ink | ink2 | mute | accent | ok | warn | err (text tokens only; never the dot tokens).

## Links in text
In-sentence links are always underlined. Standalone action links underline on hover only (see TextLink). Text itself has no hover, focus or disabled state; a disabled parent dims it to 45% with the parent.

## Props
```ts
type TextProps = { kind: TextKind; color: TextColor; as: 'p' | 'span'; tabularNums: boolean; children: ReactNode }
```
Tabular numerals (`font-variant-numeric`) for Stat, Meter, Progress values.

## Accessibility
Do not use `--color-disabled` for readable text; secondary text uses `--color-mute` (designer lists secondary text on dark in the token table).

## Light/dark
Token-driven.
