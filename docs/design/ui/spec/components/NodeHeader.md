# NodeHeader
Purpose: icon tile + overline kind + node name row shared by all nodes (page labels it node_head).
Anatomy: NodeTile 22x22 radius 6 (icon 13px, stroke 1.5) ; text column: kind overline (10.5px/600, uppercase, tracking .04em, kind colour) and name (600 13px). gap 8. Name truncates (min-width 0).
Variants: kind tint (see list). Sizes: 22 tile (18 tile in RunNode).
Props: `{ kind: NodeKind; overline: string; name: string }`.
Tokens: overline `--type-micro` (+ letter-spacing --tracking-micro), name `--type-title`, tile radius `--radius-6`, gap `--space-8`. Kind colours: agent `--color-violet-light`/`--color-violet`; send message `--color-ok-light`/`--color-ok`. Other kinds use the hue tokens: compl/guard, api, router (decision), par, kb, tool (--hue-<kind>-bg / --hue-<kind>-fg).
A11y: decorative icon aria-hidden; text conveys kind.
Light/dark: all 18 hue pairs have dark values (tokens.md); overline uses the kind fg token. The page icons `compl`, `api`, `send`, `agent`, `router`, `par`, `kb`, `tool`, `msg`, `tool-event` carry `data-icon` names.
Used: DS-Flow-Chat.
