# SearchInput
Purpose: text input with a leading magnifier for filtering lists.
Source: DS-Inputs v2 (Search). States: drawn on DS-States (light) and DS-Dark-States (dark; colours are the tokens.md dark values).

## Anatomy
wrapper (relative, `flex-shrink: 0`, width via prop, 260 in samples) > `search` icon (13px, `--color-mute`, absolute left `--space-10`, top `--space-10`) > input with `aria-label`.

## Tokens
Frame as Input md (34, radius `--radius-8`, 1px `--color-line`, bg `--color-card`), padding `0 --space-10 0 30px` (30px inset, local constant), text 12.5 (`--type-body-small`), `--color-ink`.

## States (drawn on DS-States / DS-Dark-States)
- default: frame as above.
- hover: border `--color-edge`.
- focus: border `--color-accent` + `--shadow-focus-field`.
- typing (non-empty): clear button at the right (absolute right 6, top 6): ghost IconButton xs 22x22, radius `--radius-8`, `x` 14 `--color-mute`, `aria-label` "Clear search". Escape also clears (proposal, not drawn).
- loading (results pending): the clear button is replaced by `spinner` 13 `--color-mute` (absolute right 10, top 10); page: "while results load the clear button becomes a spinner".
- disabled: global 0.45 rule.
Sample width 220 (prop).

## Props
```ts
interface SearchInputProps extends Omit<InputProps, 'size' | 'type'> { label: string; clearLabel: string; loading: boolean; onClear: () => void }
```

## Accessibility
`input type="search"`; `aria-label` required. No Radix.

## Light/dark
Token-driven.

## Used by
FilterBar, list headers (conversations, prompts).
