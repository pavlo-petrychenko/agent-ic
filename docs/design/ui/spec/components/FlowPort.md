# FlowPort
Purpose: connection handle on a flow node: where edges start (out-port) and end (in-port). New: drawn on DS-Patterns > Flow builder > Canvas interactions (light) and DS-Dark-Patterns (dark).

## Anatomy
span (absolute, round, centred on the node edge: in-port on the top edge centre, out-port on the bottom edge centre) with a border; no icon or label. Router out-ports are spread along the bottom edge (one per route plus else, in rule order), each with an EdgeLabel just below it.

## Variants
- `direction`: `in` | `out`. Triggers have only an out-port; other steps one in-port and one out-port; routers one in-port and N+1 out-ports.

## States (drawn)
- hidden: until the node is hovered or selected.
- idle (node hovered / selected): 8px, bg `--color-card`, border 2px `--color-edge`.
- hover: 12px, bg `--color-card`, border 2px `--color-accent`, halo `0 0 0 4px var(--color-accent-glow)`; cursor crosshair.
- source (dragging from this out-port): 12px, bg `--color-card`, border 2px `--color-accent`, no halo.
- valid target (while an edge is being drawn): 12px, fill `--color-accent`, border 2px `--color-accent`, halo `0 0 0 4px var(--color-accent-glow)`.
- invalid target: no port; the whole node fades to 40% (trigger, the source itself, a cycle).

## Props
```ts
enum FlowPortDirection { In = 'in', Out = 'out' }
enum FlowPortState { Hidden = 'hidden', Idle = 'idle', Hover = 'hover', Source = 'source', Target = 'target' }
type FlowPortProps = { direction: FlowPortDirection; state: FlowPortState; label: string | null; ariaLabel: string }
```

## Tokens
`--color-card`, `--color-edge`, `--color-accent`, `--color-accent-glow`; sizes 8 / 12 and border 2 are component-local constants (`PORT_SIZE = 8`, `PORT_SIZE_ACTIVE = 12`).

## Accessibility
Ports are reachable without a mouse (decided): an out-port is a focusable button ("Connect from Receptionist"); Enter starts a connection, arrows cycle the valid targets, Enter connects, Esc cancels. Edges are also creatable from the inspector.

## Light/dark
DS-Dark-Patterns: idle bg #211F1C with #7A746A border; hover and target #4DB6AE with halo rgba(77,182,174,.24).

## Used by
FlowNode, TriggerNode (out only), router nodes, FlowCanvas.

## Differs from current web
New. Scope: **DOMAIN: flow**.
