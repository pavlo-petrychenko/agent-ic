# Tag
Purpose: square-ish chip for resources attached to a node (knowledge source, tool, API, variable) and schema types.
Merged from: DS-Display (Tag) and DS-Flow-Chat (NodeChip).

## Anatomy
root (inline-flex, nowrap) > label.

## Variants (kind)
- kb: `--hue-kb-bg` / `--hue-kb-fg`
- tool: `--hue-tool-bg` / `--hue-tool-fg`, mono
- api: `--hue-api-bg` / `--hue-api-fg`
- var: `--hue-var-bg` / `--hue-var-fg`, mono
- neutral: `--color-soft` / `--color-ink-secondary`
Same palette as NodeTile kinds. `mono: null` means the default for the kind (tool and var mono; kb, api, neutral not).

## Sizes
Single: padding `--space-2` `--space-6`, radius `--radius-5`, font `--type-hint` 11; mono `--type-mono-xs`. Row gap `--space-4`.

## States
Static, not interactive (no remove or hover drawn).
UNDESIGNED: removable tag. Proposal: trailing x IconButton xs, only where a feature needs it.

## Props
```ts
enum TagKind { Kb = 'kb', Tool = 'tool', Api = 'api', Var = 'var', Neutral = 'neutral' }
type TagProps = { kind: TagKind; mono: boolean | null; children: ReactNode }
```

## Accessibility
`span`; no interaction. No Radix.

## Light/dark
Hue dark pairs are designed (all 18 kinds) in tokens.md.

## Used by
FlowNode chip row, tool lists, schema types.

## Differs from existing
New. Differs from Badge by shape (radius 5, not pill) and resource hues.
