# FlowCanvas
Purpose: pannable dotted-grid surface hosting nodes, edges, edge labels and the zoom control.

## Anatomy
Surface, dot grid, SVG edge layer (below nodes), node layer (absolute), EdgeLabel layer, ZoomControl docked bottom-left (left 16, bottom 12). Demo frame 900x330 has dashed `--color-line-dash` border, `--radius-8`.

## States
- pan / zoom (drawn rule, DS-Patterns > Canvas interactions): Space + drag or middle mouse pans; ⌘ + wheel zooms, range 25–200% (`ZOOM_MIN = 0.25`, `ZOOM_MAX = 2`). Focus-visible on the surface (decided): `--shadow-focus-ring-inset`, since the canvas fills its pane.
- Selection (drawn on DS-Patterns): click selects (2px accent border + 4px halo, `--shadow-selected`); Shift- or ⌘-click adds; dragging on empty canvas draws a marquee: 1px dashed `--color-accent` rect, fill `--color-accent-glow` (not accent-light), radius `--radius-4`; nodes touching it are selected. A floating SelectionBar shows the count, Duplicate (`copy`) and Delete (`x`).
- Ports and edge drawing (drawn): see FlowPort and FlowEdge. Dragging from an out-port draws a dashed accent edge that follows the pointer; valid in-ports light up; nodes that cannot accept (a trigger, the source itself, a cycle) fade to 40% opacity. Releasing on empty canvas opens the "Add step" menu at that point, pre-connected (decided: a Menu with PaletteItem rows).
- Palette drag and drop (drawn): the dragged item becomes a ghost node at 70% opacity with `--shadow-popover`, rotated -1.5deg; dropping on an edge inserts the step into it, shown by a 2px `--color-accent` insertion line (+ an 11px `--color-accent-dark` caption on the board); dropping on empty canvas places it unconnected; Esc cancels.
- Keyboard (drawn rule): Tab moves between nodes in flow order, Enter opens the inspector, Delete removes the selection (with an undo Toast), ⌘Z / ⇧⌘Z undo and redo, ⌘D duplicates. Ports are reachable by keyboard (decided, see FlowPort): Enter on an out-port starts an edge, arrows cycle the valid targets, Enter connects, Esc cancels.
- Minimap: not drawn, not planned on the page.
- empty canvas (decided): EmptyState centred with an "Add a trigger" button.

## Props
`{ children, zoom: number, onZoomChange, ariaLabel: string }`.

## Tokens
bg `--color-bg`; dots `--color-grid` radial 1px, 20px step (local constants); overflow hidden. Dashed frame `--color-line-dash`. Grid (decided): a 20px dot grid on `--color-bg`, as on DS-Flow-Chat. The DS-Patterns boards draw 18px on `--color-card` with a solid frame; those are board frames, not a rule.

## Responsive
Min supported width 1024px. The flow builder always uses the Rail (drawn at 1440, 1280 and 1024 on DS-Patterns > Responsive); the palette (232) stays at every width. At 1280 the canvas only narrows; below 1280 the Inspector becomes a 320 drawer over the canvas (the canvas does not resize or reflow nodes); ZoomControl stays bottom-left so the right-hand drawer never covers it.

## A11y
`<main>` landmark with aria-label in the demo (use role=region/application instead; one main per page); nodes keyboard-focusable; arrow-key nudge; no Radix. Suggest React Flow or custom (ADR).

## Light/dark
bg and grid dots swap via tokens (dark values in tokens.md).

## Used
DS-Flow-Chat (Flow builder). Not in existing code.
