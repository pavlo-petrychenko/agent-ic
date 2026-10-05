# StatusDot
Purpose: 8px dot for ok / warn / err / idle / run state; also used in Legend.
Source (states): drawn on DS-States (light) and DS-Dark-States (dark; colours are the tokens.md dark values).

## Anatomy
Single 8x8 circle (`--size-dot-md`, shrink 0).

## Variants (kind)
ok `--color-ok-dot`, warn `--color-warn-dot`, err `--color-err`, idle `--color-line-dash`, run `--color-accent`.
The dot colours are brighter than the matching text colours on purpose: text needs 4.5:1, a dot only needs 3:1 to stay visible. Do not swap in the text colours. The 6px dot inside Badge is a separate element; it follows the same dot-token rule (see Badge), although the pages draw it in the badge text colour (OPEN, INDEX section 7).

## States (drawn on DS-States / DS-Dark-States)
Static, except run: an 8px `--color-accent` dot over a 14px halo (`inset: -3px`) in `--color-accent-glow`; the halo pulses over 1.2s (matches the proposed `--duration-pulse` 1200ms); static under `prefers-reduced-motion`. Always paired with a text label: 12 (`--type-caption`) `--color-mute`, gap `--space-8` ("Connected", "Waiting", "Token revoked", "Draft", "Indexing").

## Props
```ts
enum StatusKind { Ok = 'ok', Warn = 'warn', Err = 'err', Idle = 'idle', Run = 'run' }
type StatusDotProps = { kind: StatusKind; label: string | null }
```

## Accessibility
Colour alone is not enough: needs adjacent text, or `role="img"` with `aria-label` when `label` is set; otherwise `aria-hidden`. No Radix.

## Light/dark
Dark values for the dot tokens are in tokens.md (designed).

## Used by
Legend, StatusBar, ListItem, RunRow.
