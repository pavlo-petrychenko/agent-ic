# @agent-ic/design-tokens

The design tokens of agent-ic as CSS variables, and the fonts they name.

- `tokens.css`: colours (light values on `:root`, dark values under `[data-theme='dark']` and the system preference), type as `font` shorthands, spacing, sizes, radii, shadows, motion, z-index and breakpoints. The design source is `docs/design/ui/spec/tokens.md`.
- `fonts.css`: the self-hosted variable fonts the tokens name, Onest and JetBrains Mono, from `@fontsource-variable`. They live here because `--font-sans` and `--font-mono` name their families, so a page that loads the tokens gets the fonts that match.

Used by `apps/web`, through `src/shared/styles/index.ts`:

```ts
import '@agent-ic/design-tokens/fonts.css';
import '@agent-ic/design-tokens/tokens.css';
```

Plain CSS, no build step. Turbo hashes the CSS files as the package's `build` inputs, so a token change rebuilds every app that uses it.

Must not hold: component styles, resets, Tailwind setup or anything app-specific. Those stay in the app.
