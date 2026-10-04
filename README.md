# agent-ic

Multi-tenant platform for building and running AI agents.

Documentation lives in `docs/`: `architecture.md`, `mvp-scope.md`, `communication.md` and `adr/`.

## Layout

- `apps/backend` NestJS backend, one image started in three roles (api, gateway, worker)
- `apps/web` React web app
- `packages/contracts` constants shared by backend and web
- `packages/flow` flow graph schema and validation
- `packages/tsconfig` shared TypeScript configs
- `packages/oxc-config` shared oxlint and oxfmt configs

## Commands

```
pnpm install
pnpm build
pnpm lint
pnpm typecheck
pnpm test
pnpm format
```
