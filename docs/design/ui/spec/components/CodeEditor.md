# CodeEditor
Purpose: framed code viewer/editor with a file header.

## Anatomy
section (border `--color-line`, radius `--radius-12`, overflow hidden, bg `--color-card`) > header (height 34 = `--size-control-md`, padding 0 14, bg `--color-dark`, space-between; file name `--type-mono` `--color-code-fg`, language 12px `--color-on-dark-secondary`) + dark CodeBlock body (radius 0 0 12 12).

## States
Static as drawn (read-only look). Editable focus: field rule (1px accent border + 3px soft halo, `--shadow-focus-field`) on the frame. UNDESIGNED: error markers, unsaved dot, read-only badge. Proposal: unsaved dot (StatusDot warn) before the file name.

## Props
```ts
type CodeEditorProps = { file: string; language: string; code: string; readOnly: boolean; onChange: (code: string) => void }
```

## Accessibility
Editable: labelled editor, Esc-then-Tab guidance for the tab trap. Editor library (Monaco/CodeMirror) is an ADR. No Radix.

## Light/dark
Header and body stay dark in both themes. Drawn on DS-Dark-Display: frame bg `--color-card` #211F1C, border `--color-line` #34312C; header `--color-dark` #3A3631 (raised, lighter than the body in dark), language `--color-on-dark-secondary` #CFCAC1, file name `--color-code-fg` #E8E4DC; body `--color-code-bg` #0E0D0C.

## Used by
Custom tools.
