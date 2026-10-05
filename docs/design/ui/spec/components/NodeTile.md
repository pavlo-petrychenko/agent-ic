# NodeTile
Purpose: rounded square icon tile coloured by step type or status hue, optionally with a label. The single tile component for node headers, palette rows, list/nav items, trace rows, option leads and empty states.
Merged from: DS-Foundations (NodeTile), DS-Display (TypeTile; deleted) and the inline "IconTile" of DS-Data (ListItem, PaletteItem, TraceRow, TableCellLead) and DS-Navigation (SecondaryNav tile tones).

## Anatomy
tile (flex centred) > `Icon` (`currentColor`, 1.5 stroke, aria-hidden, carries `data-icon`); optional label span beside it (gap `--space-8`).

## Variants
`kind` enum (18 hues, tokens.md hue table): trig, agent, compl, router, par, wait, send, api, kb, tool, var, esc, gen, neutral, info, ok, warn, err. Plus `accent` (bg `--color-accent`, fg `--color-on-accent`; Sidebar logo mark, 28; the Foundations header logo uses 28 with the `logo` icon, radius 8). Avatar-like accent tint is Avatar, not NodeTile.
Mapping of the design's ad hoc tile tints to hues: rose = tool, teal/blue-teal = api, blue = compl, brown = kb, amber = router, green = par, violet = agent/gen, dark = trig.
Default icon per kind (confirmed on the page): trig=msg, agent=agent, compl=compl, router=router, par=par, wait=wait, send=send, api=api, kb=kb, tool=tool, var=var, esc=esc, gen=sparkle, neutral=box, info=info, ok=check, warn=alert, err=alert. (`bolt` is the event-trigger glyph elsewhere; the Trigger hue tile shows `msg`.)

## Sizes
xs `--size-tile-xs` 18 (radius `--radius-6`, icon 11, RunRow/RunNode), sm `--size-tile-sm` 22 (radius 6, icon 13, NodeHeader, IconRow, PaletteItem, TraceRow), md `--size-tile-md` 28 (radius `--radius-8`, icon 15, default, ListItem, Notice), lg `--size-tile-lg` 34 (radius 8, icon 17, OptionCard, EmptyState, TableCellLead icon lead).

## Tokens
bg `--hue-<kind>-bg`, fg `--hue-<kind>-fg`; label `--type-body-small` in `--color-ink` (dark panel uses `--color-ink-secondary`).

## States
Static, decorative (no hover/focus/disabled); the parent supplies interaction. Selected state belongs to the parent (2px accent border + 4px glow), never the tile.

## Props
```ts
enum NodeKind { Trig = 'trig', Agent = 'agent', Compl = 'compl', Router = 'router', Par = 'par', Wait = 'wait', Send = 'send', Api = 'api', Kb = 'kb', Tool = 'tool', Var = 'var', Esc = 'esc', Gen = 'gen', Neutral = 'neutral', Info = 'info', Ok = 'ok', Warn = 'warn', Err = 'err' }
enum TileSize { Xs = 'xs', Sm = 'sm', Md = 'md', Lg = 'lg' }
type NodeTileProps = { kind: NodeKind | 'accent'; size: TileSize; icon: IconName | null; label: string | null }
```

## Accessibility
Decorative; icon `aria-hidden`; the label or adjacent text names it. Give `aria-label` if used alone. No Radix.

## Light/dark
Swap hue vars. All 18 kinds now have designed dark pairs (tokens.md hue table), including wait #2A2824/#BDB6A8, tool #33202A/#E393AC, var #24272C/#AEB6C2, neutral and info. Trigger is #2A2723 in light and raised #3A3631 in dark (never near-black). Dark panel label text: `--color-ink-secondary` (#CFCAC1).

## Used by
Foundations (hues, dark panel), FlowNode/CompactNode/TriggerNode/RunNode headers, PaletteItem, ListItem, SecondaryNav, TraceRow, TimelineWaterfall bars (solid `--hue-<kind>-fg`), OptionCard, EmptyState, Notice, LinkCard, IconRow, TableCellLead, Tag palette.

## Differs from existing
No tile exists; hue tokens absent in `tokens.css`.
