# 0017. Prompt editor on Tiptap

- **Status:** Accepted
- **Date:** 2026-10-05

## Context
- The design system has a `PromptEditor` (`apps/web/src/shared/ui/inputs/PromptEditor`): a multi-line editor for agent prompts with inline variable chips. Typing `{{` opens a variable menu at the caret; the menu inserts a chip such as `{{contact.name}}`. The chip is the same `VariableChip` the rest of the UI uses.
- A `<textarea>` cannot draw a chip inside the text, and a `<textarea>` with an overlay breaks on wrapping, selection and IME input. The component needs a real rich-text surface.
- The design asks for: a textbox with `aria-multiline`, a listbox driven by `aria-activedescendant` (focus stays in the editor), a focus, error and read-only look, and unknown variables drawn as plain text with a wavy underline.
- The value the rest of the app stores is plain text with `{{path}}` tokens and `\n` between lines. The editor must not leak its own document format.
- Open question 26 of the design index named two candidates, Tiptap and Lexical. The product owner chose Tiptap on 2026-10-04.

## Decision
1. **Use Tiptap 3 (ProseMirror) for `PromptEditor` only.** Packages in `apps/web`: `@tiptap/react`, `@tiptap/core`, `@tiptap/pm`, `@tiptap/extension-document`, `@tiptap/extension-paragraph`, `@tiptap/extension-text`, `@tiptap/extensions` (undo/redo and placeholder). No `StarterKit`: bold, lists, headings and links are not wanted in a prompt.
2. **Document model:** `doc > paragraph+ > (text | variable)`. `variable` is an inline atom node with a `path` attribute, drawn by a React node view that renders `VariableChip`. A path that is not in the `variables` prop is drawn as plain `{{path}}` with the error underline instead of a chip.
3. **The public value stays a string.** `shared/prompt` holds the pure conversion in both directions (`promptToDocument`, `documentToPrompt`), the `{{` trigger match and the token patterns. The component echoes its own `onChange` values back without resetting the document, so fast typing is not overwritten by a stale prop.
4. **The variable menu is not a Tiptap suggestion plugin.** The component detects `{{query` before the caret itself, anchors a Radix Popover to the caret rectangle, and keeps focus in the editor. The listbox looks like `Menu` but is rendered by the editor, because `Menu` moves real focus to its options and the editor needs `aria-activedescendant`.
5. **Typing or pasting a finished `{{path}}` turns it into a chip** (input rule and paste rule on the node).
6. **Only open-source (MIT) Tiptap packages are used.** No Tiptap Cloud, no Pro extensions.
7. **Other editors are separate decisions.** `CodeEditor` (CodeMirror or Monaco) is not decided here.

## Consequences
- One more editor dependency set in the web bundle (ProseMirror and Tiptap), loaded wherever `PromptEditor` is used. If this matters, the component can be lazy-loaded behind its own import.
- The `{{path}}` text format is the contract with the backend. Changing the syntax means changing `shared/prompt` and the backend resolver together.
- jsdom does not implement the layout APIs ProseMirror calls (`Range.getClientRects`, `document.elementFromPoint`), so the shared Vitest setup stubs them. Input rules that depend on real browser text input events are covered by unit tests of the patterns, not by simulated typing.
- Features that need rich text elsewhere (comments, notes) can reuse the same dependency, but each needs its own schema and its own review.

## Alternatives considered
- **Lexical:** small core, but a lower-level API and no ready-made input and paste rules for inline atoms. The owner chose Tiptap.
- **`<textarea>` plus a mirrored overlay:** chips cannot be real elements and the overlay drifts from the caret on wrap and scroll.
- **`contenteditable` written by hand:** undo, selection, IME and paste handling would all be ours to build and maintain.
- **CodeMirror for prompts:** strong for code, but the prompt is prose with chips, and the chip and menu behaviour would be custom work anyway.
- **Tiptap `Suggestion` utility for the menu:** it fits a headless renderer, but it adds a second state machine beside React and renders the menu outside our Popover. A small own detector is shorter and testable.
