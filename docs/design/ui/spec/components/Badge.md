# Badge
Purpose: pill for status and short attributes; optional leading dot marks live status. Also the "status pill" (state/outcome in tables, lists, Topbar, FileRow).
Merged from: DS-Display (Badge), DS-Foundations (dark samples), DS-Data and DS-Navigation (StatusPill; deleted as a duplicate, `StatusPill` is `Badge` with `dot`).

## Anatomy
root (inline-flex, gap `--space-5`, nowrap, `justify-self: start`) > optional dot (`--size-dot-sm` 6 circle, colour by tone, see Dot colour, aria-hidden) > label.

## Variants (tone)
- neutral: bg `--color-soft`, text `--color-ink-secondary`
- ok / warn / err / violet: bg `--color-<tone>-light`, text `--color-<tone>`
- accent: bg `--color-accent-light`, text `--color-accent-dark` (Running, "You", "A/B")
- dark: bg `--color-dark`, text `--color-on-dark`
- outline: transparent, border `--border-width` `--color-line`, text `--color-ink-secondary`
Modifiers: `dot` (shown for status states: Live, Waiting, pass, fail; hidden for "You", "custom", "quality N"), `mono` (`--type-mono-xs` 11, used for scores and ids).

## Dot colour
The dot follows the Foundations dot rule (3:1 for a 6px dot, text 4.5:1), so it is the brighter status-dot token, not the text colour: ok `--color-ok-dot`, warn `--color-warn-dot`, err `--color-err`, accent `--color-accent`, neutral and outline `--color-line-dash`, dark `--color-on-dark`, violet `--color-violet`. The design pages draw the dot in the text colour (a known mismatch, resolved in favour of the rule; Topbar and StatusDot already follow it). DS-States and DS-Dark-States repeat the mismatch (Waiting dot `--color-warn`, Live / Indexed dot `--color-ok`, Failed dot `--color-err`); still OPEN for confirmation. DS-States also draws a neutral count pill inside Tabs (11.5, padding 2 8).

## Sizes
Single: padding `--space-2` `--space-8`, radius `--radius-pill`, font `--type-small` (11.5).

## States
Static; no hover, focus or disabled (inside a disabled parent it dims with it, 45%). Live status changes (Indexing to Indexed) are announced by the parent via `role="status"`.

## Props
```ts
enum BadgeTone { Neutral = 'neutral', Ok = 'ok', Warn = 'warn', Err = 'err', Accent = 'accent', Violet = 'violet', Dark = 'dark', Outline = 'outline' }
type BadgeProps = { tone: BadgeTone; dot: boolean; mono: boolean; children: ReactNode }
```

## Accessibility
`span`; meaning is in the text, never colour alone; dot `aria-hidden`. No Radix.

## Light/dark
All pairs come from tokens.md (every tone has a designed dark pair). Violet stays as the agent hue; blue and violet accents are design-tool options only and are not Badge tones.

## Used by
DS-Display (matrix), DS-Data (Table cells, ConversationRow, RunRow quality, ChartCard meta), DS-Navigation (Topbar draft pill, FileRow status), CountBadge and SourceBadges compose it, Foundations dark panel, version cards.

## Differs from existing
No Badge in `shared/ui`.
