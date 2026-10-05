# 0018. CodeMirror 6 for the code editor

- **Status:** Accepted
- **Date:** 2026-10-05

## Context
- The design system's `CodeEditor` is a framed editor with a file header. Its first use is the code of a custom tool, so it must edit JSON and JavaScript or TypeScript. The spec leaves the library open: "Monaco or CodeMirror, an ADR".
- Requirements from the spec:
  - it looks the same in light and dark, because the header and body are always dark;
  - it takes its colours, font and spacing from our design tokens;
  - the frame shows the field focus rule when the editor has focus;
  - keyboard users can leave the editor (Esc, then Tab);
  - it also works as a plain read-only view.
- The web app is a small SPA for small businesses. The bundle size matters, and the editor is needed on one screen.
- **Monaco:**
  - the editor of VS Code, with a large feature set (IntelliSense, a diff view, a minimap);
  - about 2 MB or more of JavaScript, web workers, and a loader that is awkward with Vite and jsdom;
  - its own theming system, so token-driven styling needs a JavaScript theme with fixed colour values;
  - it does not fit mobile or narrow layouts well.
- **CodeMirror 6:**
  - modular: only the packages we import are bundled (state, view, commands, language, two language packs);
  - styled with CSS, so a theme can use our CSS variables and follow the light and dark switch with no extra code;
  - accessible by design: tab-focus mode, ARIA attributes on the content element;
  - works in jsdom with two small stubs, so components can be tested.

## Decision
1. **`CodeEditor` uses CodeMirror 6**, from `@codemirror/state`, `view`, `commands`, `language`, `lang-json` and `lang-javascript`.
2. CodeMirror is used **only inside `shared/ui/CodeEditor`**, like Radix. Features use the `CodeEditor` component, never CodeMirror.
3. **Read-only mode does not load an editor.** It renders `CodeBlock` in its dark tone. An editor is created only when `readOnly` is false and an `onChange` handler is given.
4. **The theme is built from our CSS variables** (`--color-code-bg`, `--color-code-fg`, `--type-mono-lg`, and others), so no colour is written twice.
5. **Keyboard:** Tab indents (`indentWithTab`); Esc switches on tab-focus mode for a moment, so Esc then Tab leaves the editor. A `hint` prop carries a text for screen readers that explains this, because strings arrive as props.
6. **Out of scope for now:** syntax colours (the design draws plain code), line numbers, autocomplete, linting. Each can be added later as another CodeMirror extension without changing the component's props.

## Consequences
- One more dependency family in `apps/web`: six small `@codemirror/*` packages.
- The editor is a controlled component: `code` goes in, `onChange` reports edits. A new `code` prop replaces the document without calling `onChange`, so it does not loop.
- Tests need `Range.prototype.getClientRects` and `getBoundingClientRect` stubs in jsdom, kept in the component test.
- If a later feature needs IntelliSense or a diff view, a new ADR can move that screen to Monaco, loaded lazily.
- The undesigned parts use the spec's proposals: an unsaved marker (a warn `StatusDot` before the file name, shown by the `unsaved` prop) and no error markers.

## Alternatives considered
- **Monaco:** more features than the tool editor needs, with a much larger bundle and a theme that cannot use CSS variables directly.
- **A `textarea` with `CodeBlock` styling:** no dependency, but no indentation, no bracket matching and no path to syntax colours or a language server later.
- **Lexical or Tiptap:** rich-text editors; they are for the prompt editor with variable chips, not for code.
