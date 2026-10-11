# apps/landing

The marketing site at the product's public address. Static HTML and SCSS built with Vite, no UI framework, a little vanilla TypeScript only where the page needs behaviour. Rules that apply everywhere are in the root `AGENTS.md` and `docs/rules/`; where each file goes is in `docs/rules/structure.md`.

## How a page is built

- `index.html` is the one page template. `vite.pages.ts` renders it once per language at build time: `/index.html` (English) and `/uk/index.html` (Ukrainian).
- `{{t.…}}` placeholders read `src/locales/<language>.json`; `{{page.…}}`, `{{alternate.…}}`, `{{path.…}}`, `{{current.…}}` and `{{link.…}}` come from `pageValues` in `vite.render.ts`. Every value is HTML-escaped, and a placeholder without text fails the build.
- Both locale files have the same keys; a test checks it.
- `vite.env.ts` reads `LANDING_APP_URL` (the web app, target of the sign-up and login links) and `LANDING_SITE_URL` (this site, for canonical and alternate links) and validates them with zod. They come from the environment, or from the repo root `.env` locally (`.env.example` has the local values).
- The build writes `dist/_redirects` for Cloudflare Pages: `/auth/*`, `/w/*` and `/invite/*` go to the same path on `LANDING_APP_URL` with a 301.
- It also writes `dist/robots.txt` and `dist/sitemap.xml` from `LANDING_SITE_URL`. Open Graph images are `public/og/<language>.png`, 1200×630, one per language.
- No cookies, analytics, external fonts or external scripts.

## Commands

| Command | What it does |
| --- | --- |
| `pnpm --filter landing dev` | dev server; `/` and `/uk/` render from the template |
| `pnpm --filter landing build` | builds `dist/` |
| `pnpm --filter landing preview` | serves `dist/` |
| `pnpm --filter landing test` | tests of the build helpers |

## Source

```
src/
├── main.ts       entry: fonts, tokens and styles; behaviour such as the mobile menu
├── locales/      en.json · uk.json
├── styles/       .scss files
└── helpers/  constants/  typedefs/
```

- `src/` imports only its own files and `@agent-ic/design-tokens` (dependency-cruiser).
- Colours, type and spacing come from the design tokens; light theme only (`data-theme="light"` on `<html>`).
- The page works without JavaScript; scripts only add behaviour.
- Icons are symbols in `public/icons.svg`, used as `<svg class="icon"><use href="/icons.svg#name" /></svg>`; the parent sets the size, `.icon` the stroke.
- Design sizes that have no token (marketing type scale, section spacing, breakpoints) are SCSS variables in `src/styles/_scale.scss`.

## Deploy

`.github/workflows/landing.yml` builds and deploys `dist/` to the Cloudflare Pages project `agent-ic-landing`: production on a push to `main`, a preview per pull request with a comment that links it. It needs the secrets `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` and the repository variables `LANDING_APP_URL` and `LANDING_SITE_URL`; without the token the deploy is skipped.
