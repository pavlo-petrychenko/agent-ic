# @agent-ic/tsconfig

Shared TypeScript configs: `base.json` (strict settings and the `source` export condition), `node.json` (backend), `react.json` (web), `library.json` (shared packages).

Used by every app and package through `extends`.

Must not hold: app-specific paths, includes or aliases. Those stay in each project's own `tsconfig.json`.
