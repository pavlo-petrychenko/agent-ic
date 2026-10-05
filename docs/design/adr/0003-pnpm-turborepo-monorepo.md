# 0003. pnpm workspaces + Turborepo monorepo

- **Status:** Accepted
- **Date:** 2026-10-02

## Context
The backend, the frontend, docs and a few shared packages (GraphQL schema, flow schema, domain constants, tooling config) change together. One PR should be able to change the API and the UI at the same time.

## Decision
- One repository managed with **pnpm workspaces**.
- **Turborepo** orchestrates tasks: build, codegen, typecheck, lint and test, in dependency order, with caching and `--affected` in CI.
- Layout:
  - `apps/` holds the things we deploy;
  - `packages/` holds code needed by 2+ consumers;
  - `deploy/` holds Dockerfiles and the Helm chart;
  - `docs/`, `tools/`.

## Consequences
- pnpm's strict `node_modules` catches undeclared ("phantom") dependencies.
- `turbo prune` gives lean Docker build contexts.
- Teammates need pnpm (through corepack) and must learn a little Turbo config.
- No generators or built-in boundary rules, so boundaries are enforced with dependency-cruiser (see ADR 0001).

## Alternatives considered
- **npm workspaces:** no extra tool, but a flat `node_modules` allows phantom imports, and workspace filtering is weaker.
- **Yarn Berry, Bun:** Plug'n'Play friction with tools; Bun's workspace and Node-compatibility edges are still rough.
- **Nx:** more powerful (graph, generators, boundary rules) but heavier and opinionated. Not needed for 2 apps and 4 packages.
- **No task runner:** no caching and no task graph; CI time grows quickly.
