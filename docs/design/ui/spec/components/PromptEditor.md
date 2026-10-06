# PromptEditor
Purpose: large rich-text-like editor surface for prompts with inline VarTokens; typing {{ opens a variable menu (VariableMenu popover).
Source: Surface states drawn on DS-States / DS-Dark-States ("Prompt editor", `editor_surface`).
Anatomy: editor surface (role=textbox, aria-multiline), inline VariableChip spans, anchored VariableMenu (listbox of options).
Variants: with menu open; menu closed (not shown).
Sizes: example 520px wide, 200px tall (props); radius 12. The menu is drawn open with the half-typed token `{{contact.` highlighted.
States: default; menu open with one active option (designed). Surface states drawn on DS-States (300x110 sample, padding 18 20, radius 12, JetBrains Mono 13, line-height 1.7, `--color-ink-secondary`, inline VariableChip padding 0 3, radius `--radius-4`, `--color-accent-light` / `--color-accent-dark`): focus = border `--color-accent` + `--shadow-focus-field`; error = border `--color-err` (no halo), the unknown token drawn as plain text with `text-decoration: underline wavy --color-err`, offset 3px (no chip), message below 11.5 `--color-err` gap `--space-6` ("Unknown variable user.nmae — did you mean user.name?"); read-only = bg `--color-panel`, border unchanged, reason below 11.5 `--color-mute` ("v4 is published — create a draft to edit"). Disabled and empty/placeholder: still UNDESIGNED (proposal: disabled uses the global 0.45 rule; placeholder `--color-mute`). Font conflict: DS-States draws the surface in mono 13 at line-height 1.7, the Tokens line below says sans `--type-body` with `--leading-relaxed` (1.45): OPEN.
Props proposal:
```ts
interface VariableOption { id: string; label: string; group: string }
interface PromptEditorProps { value: string; onChange: (v: string) => void; variables: VariableOption[]; label: string; height: number | null; invalid: boolean; error: string | null; readOnly: boolean; readOnlyReason: string | null }
```
Tokens:
- Surface: background --color-card; border --border-width solid --color-line; radius --radius-12; padding --space-18 --space-20; text --type-body size with line-height --leading-relaxed, colour --color-ink-secondary; white-space pre-wrap.
- Inline variable tokens render as `VariableChip`; the popover is a `Menu` (listbox rows, 3 options shown: contact.phone, contact.notes, channel, each with its group) anchored with Radix Popover.
- VariableMenu: width --size-menu-width; background --color-card; border --color-line; radius --radius-10; shadow --shadow-popover; padding --space-6; item gap --space-2; z-index --z-dropdown.
- Option: padding --space-7 --space-8; radius --radius-6; layout space-between gap --space-10; label mono 12 (`--type-mono`) `--color-ink`; group text sans 11 (`--type-hint`) `--color-mute`; active/selected background --color-accent-light, others transparent.
- Menu position: absolute at caret.
A11y: role=textbox aria-multiline; menu is role=listbox with role=option and aria-selected; use aria-activedescendant, ArrowUp/Down, Enter/Tab to insert, Escape closes. Radix does not provide this; use a rich-text lib (e.g. Tiptap/Lexical) plus Radix Popover for anchoring, or Floating UI.
Light/dark: token-driven; the popover shadow has a dark value.
Differs from current: component does not exist; first rich editor.
Used by: DS-Inputs.dc.html (Inputs page) (Prompt editor section).
