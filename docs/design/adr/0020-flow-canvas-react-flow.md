# 0020. React Flow for the flow canvas

- **Status:** Accepted
- **Date:** 2026-10-05

## Context
- The flow builder draws the agent as a graph: triggers, steps, routers with labelled routes, edges between them. The design system specs it as `FlowCanvas` with `FlowEdge`, `ZoomControl`, `FlowPort`, `SelectionBar`, `Menu` and `Toast`, and the node components `FlowNode`, `TriggerNode` and `CompactNode`.
- D56 in `architecture.md` already chose React Flow (`@xyflow/react`) for the canvas. The spec still asked for an ADR ("React Flow or a custom canvas"), and no ADR recorded the version, what we wrap or where it may be imported.
- Requirements drawn on DS-Flow-Chat and DS-Patterns:
  - a 20px dot grid on `--color-bg`; pan with Space + drag or the middle mouse button; ⌘ + wheel zooms from 25% to 200%;
  - click, Shift- or ⌘-click to select; a marquee on empty canvas selects every node it touches; a floating SelectionBar for the selection;
  - dragging from an out-port draws a dashed accent curve; valid in-ports light up, nodes that cannot accept fade to 40%; release on empty canvas opens "Add step";
  - placed edges are orthogonal with a filled arrowhead at the target, and a delete button at the midpoint when selected;
  - palette drag and drop, with an insertion line when the drop lands on an edge;
  - keyboard: Tab between nodes in flow order, Enter opens, Delete removes with an undo Toast, ⌘Z, ⇧⌘Z and ⌘D; ports work by keyboard (Enter starts, arrows cycle targets, Enter connects, Esc cancels);
  - every colour comes from our tokens and follows the light and dark switch.
- **React Flow 12** (`@xyflow/react`): custom nodes and edges are plain React components; handles, connection drawing, viewport transforms, pan, zoom, marquee selection and node dragging are built in; it renders HTML nodes over an SVG edge layer, so our token styles apply; controlled `nodes`, `edges` and `viewport` fit the "graph state stays outside" rule.
- **A custom canvas:** no dependency, but pan and zoom maths, hit testing for ports and edges, marquee selection, dragging and the connection line are all ours to write and test.

## Decision
1. **`FlowCanvas` uses React Flow 12** (`@xyflow/react@^12.12.0`, MIT) for the viewport, nodes, edges, handles, connection drawing, dragging and marquee selection.
2. React Flow is imported **only inside `apps/web/src/shared/ui/flow/`**. A dependency-cruiser rule, `web-react-flow-only-in-shared-ui-flow`, fails any other import, the same way Radix is kept inside `shared/ui`.
3. **What is wrapped:**
   - `FlowCanvas` is controlled. It takes plain data (`nodes`, `edges`, `selection`, `viewport`) and reports every change through callbacks (`onNodesMove`, `onSelectionChange`, `onConnect`, `onDelete`, `onUndo`, `onRedo`, `onDuplicate`, `onOpenNode`, `onPaletteDrop`, `onAddStep`, `onViewportChange`). The graph, history and validation live in the flow-builder feature.
   - Each node is drawn by the caller through `render(slots)`, so the canvas does not know node kinds. The slots carry the React Flow handles, each wrapping our `FlowPort`.
   - Edges are our `FlowEdge`: an orthogonal path from React Flow's step path with a zero radius, and a Bézier curve for the line being drawn.
   - `ZoomControl`, `SelectionBar`, the "Add step" `Menu`, the empty state and the undo `Toast` are ours, drawn over the canvas. React Flow's own controls, minimap and attribution are not used.
   - Keyboard shortcuts, keyboard connection and palette drop are handled by `FlowCanvas`. React Flow's delete key, node focus and keyboard moves are off, so focus lands on our node components.
4. **Styling is ours.** Only `@xyflow/react/dist/base.css` is loaded; the grid colour, marquee, handles and edges are styled from tokens in `.module.scss`.
5. Nodes and edges use only `@xyflow/react`. The flow document schema stays in `@agent-ic/flow`; `shared/ui/flow` does not import it.

## Consequences
- One more dependency in `apps/web`: `@xyflow/react`, which brings `@xyflow/system`, `d3-zoom`, `d3-drag`, `d3-selection` and `zustand`.
- Node components stay plain props-in components with port slots, so they render in Storybook and tests without React Flow.
- In jsdom React Flow cannot measure nodes, so it renders them with `visibility: hidden`. Tests find nodes by label rather than by role.
- A later minimap or a different edge router can be added inside `shared/ui/flow` without touching the feature.

## Alternatives considered
- **A custom canvas:** full control and no dependency, but much more code to own for pan, zoom, hit testing and selection than the builder justifies.
- **React Flow's built-in edges and controls:** less code, but their look and keyboard behaviour differ from the drawn ones and are hard to style from tokens.
- **Rete.js, JointJS:** heavier frameworks with their own rendering and plugin models; React Flow fits our React component idiom.
