# FlowEdge
Purpose: connector line between nodes (SVG path, orthogonal with H/V segments).
Anatomy: path plus a filled arrowhead at the target end (decided). Ports: see FlowPort.
Variants: default (stroke `--color-edge`, 1.5px); active (stroke `--color-accent`, 2px). The arrowhead fill follows the edge colour: `--color-edge` by default, `--color-accent` when active or selected.
Props: `{ path: string; active: boolean }`.
Tokens: `--color-edge`, `--color-accent`; widths 1.5/2 and the arrowhead size are local constants.
A11y: aria-hidden; connection state exposed via node and label text.
Selection/active: active = accent 2px (the "else" edge on the page). Drawn on DS-Patterns > Canvas interactions: hover = stroke `--color-ink` (width unchanged); selected (click) = `--color-accent` 2.5px (no halo) with a delete button at the midpoint (IconButton 24x24, border `--color-line`, bg `--color-card`, icon `x` 14 `--color-ink`, radius `--radius-8`, aria-label "Delete connection"); drawing = `--color-accent` 2px dashed `5 4`, following the pointer as a cubic curve; router edges carry their condition label (EdgeLabel), and clicking the label edits the rule in the inspector. Path shape and arrowheads (decided): a placed edge is an orthogonal H/V path with a filled arrowhead at the target in the edge's colour. The edge being drawn is a dashed (`5 4`) accent cubic curve with no arrowhead.
Props: `{ path: string; active: boolean; selected: boolean; drawing: boolean; onDelete: (() => void) | null; deleteLabel: string | null }`; widths 1.5 / 2 / 2.5 are local constants.
Light/dark: --color-edge (#9C958A light) has a dark value in tokens.md.
Used: DS-Flow-Chat.
