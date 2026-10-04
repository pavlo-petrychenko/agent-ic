# Architecture

**Status:** draft, Oct 2026. Covers the MVP in [mvp-scope.md](mvp-scope.md) and is built to scale towards the full vision.

**Diagrams** (ExcaliDash, collection `agent-ic`):
1. System architecture
2. Deployment — homeserver (k3s, MVP)
3. Deployment — AWS target (EKS)
4. Communication map
5. Sequence — customer message to reply

Who talks to whom, and every main chain step by step: [communication.md](communication.md).

Decision markers used below:
- ✅ **Decided**: agreed by the team.
- 🟡 **Proposed**: the current default; open to change until someone builds on it.
- ⏳ **Open**: not discussed yet.

---

## 1. Decisions so far

| # | Decision | Status |
|---|---|---|
| D1 | TypeScript everywhere: Node.js backend, React frontend | ✅ |
| D2 | Postgres as the main database; Redis for cache and queues | ✅ |
| D3 | **Modular monolith**: one codebase and one image, run as several Kubernetes Deployments (process roles) | ✅ |
| D4 | A separate **`gateway`** Deployment for customer traffic coming in (Telegram webhooks, API channel) | ✅ |
| D5 | Kubernetes for every environment except local dev: k3s on the homeserver for the MVP, AWS (EKS) later | ✅ |
| D6 | Observability: **Langfuse for LLM traces in the MVP**: **self-hosted on the homeserver** (after a RAM upgrade), Langfuse Cloud as the fallback; admin-only links; can be switched off. Our own run traces later, if time allows, then Langfuse is dropped. Prometheus + Grafana for platform metrics (D47, D48) | ✅ |
| D7 | Queues: **BullMQ** on Redis (`@nestjs/bullmq`); no Kafka or RabbitMQ | ✅ |
| D8 | **Retrieval index in Postgres, portable to RDS:** BM25 computed in SQL over `tsvector` (IDF per KB) + pgvector **exact search scoped to the agent's KBs** (`halfvec`; no global HNSW) + `pg_trgm` on titles / names, fused with RRF (k=60), all behind a `Retriever` abstraction (ParadeDB `pg_search` / Qdrant could replace parts of it later). Research: [knowledge-retrieval.md](research/knowledge-retrieval.md) | ✅ |
| D9 | Frontend: React + Vite single-page app, React Flow for the canvas, react-i18next | 🟡 |
| D10 | **Dashboard API: GraphQL, schema-first.** SDL is written in backend modules; the merged schema is generated into `packages/api-schema` (not committed); codegen types both the resolvers and the web operations | ✅ |
| D11 | LLM layer: **Vercel AI SDK** behind our `LlmGateway` abstract class (multiple providers, structured output from zod, tool loops, embeddings, per-request provider instances for BYOK, OpenTelemetry → Langfuse) | ✅ |
| D12 | ORM: **Drizzle**: native pgvector, `pgSchema` per module, SQL migrations from drizzle-kit; repositories are classes wrapping it; transactions through the `@nestjs-cls/transactional` adapter | ✅ |
| D13 | Monorepo: **pnpm workspaces + Turborepo** | ✅ |
| D14 | GitOps: **Argo CD** deploys the OCI Helm charts; GitHub Actions builds the images and charts | ✅ |
| D15 | **NestJS with native DI** (ADR 0010), **Express adapter**, **Apollo GraphQL driver** (`@nestjs/apollo`, schema-first via `typePaths`, subscriptions via graphql-ws + Redis PubSub) | ✅ |
| D16 | **`gateway` stays REST**: Telegram webhooks and the API channel (`/v1/channels/{id}/messages`, `/events`) | ✅ |
| D17 | **Realtime: GraphQL subscriptions** (`graphql-ws`), fanned out across `api` replicas through Redis pub/sub | ✅ |
| D18 | **Two repos**: `agent-ic` (code, Dockerfiles, Helm chart) and `agent-ic-deploy` (env values, Argo CD apps, platform add-ons, Terraform) | ✅ |
| D19 | **The Helm chart lives in the app repo** and is published as an OCI artifact with the same version as the image; the deploy repo pins the version | ✅ |
| D20 | Shared packages (names updated by D78): `api-schema`, `flow`, `contracts`, `tsconfig`, `oxc-config` (D79). Domain modules live inside `apps/backend` | ✅ |
| D21 | **Telegram: webhooks in production**; a long-polling transport only for local dev, behind one `handleTelegramUpdate()` entry point (ADR 0008) | ✅ |
| D22 | **Process roles only assemble; logic lives in modules.** Each module exposes GraphQL (mounted by `api`), HTTP routes (mounted by `gateway`) and job handlers (run by `worker`). One `worker` entrypoint takes `--queues=…`; `worker-runs` / `worker-ingest` are just Deployment configs | ✅ |
| D23 | **Transport-agnostic use cases, with permissions checked in the use case** (ADR 0009). Dependencies through Nest constructor DI; per-request data as an explicit `ctx` argument (ADR 0010) | ✅ |
| D24 | **Classes everywhere** (use cases, repositories, gateways, resolvers, controllers, job processors); plain functions only for pure helpers | ✅ |
| D25 | **LLMAPI (llmapi.ai) is the platform's LLM provider**, called through the AI SDK's OpenAI-compatible provider; BYOK keys go to providers directly | ✅ |
| D26 | **KB document model:** canonical Markdown per document → section tree from headings → chunks that never cross sections. Tables kept whole + one line per row; "Doc › H2 › H3" + summary prefix; hashes for incremental re-sync; re-sync by generation with an atomic flip; small-to-big expansion to the section / document | ✅ |
| D27 | **Embeddings: `jina-embeddings-v5-text-small` via LLMAPI** (`https://api.llmapi.ai/v1`, 1024 dims, `halfvec`). Verified 2026-10-02: `dimensions` passes through and latency is ~120 ms per query, but **Jina's `task` (query / passage) is dropped by LLMAPI**. We ship as is and ask LLMAPI to pass `task` through; once they do, KBs are re-indexed in the background. Embedding model + dims stored **per KB**, so BYOK embeddings are possible later (MVP: platform model only) | ✅ |
| D28 | **Retrieval mode is configurable** per Agent step. **Default: the agent searches through tools** (`search_knowledge`, `browse_documents`, `read_document`). Option: automatic search before every reply, skipped for greetings / very short messages | ✅ |
| D29 | **Every retrieval stage is a toggle with a safe default**: retrieval mode, rerank, query rewrite, chit-chat skip; later LLM-written chunk context and whole-KB-in-prompt. Evaluations decide when a default changes | ✅ |
| D30 | **Pluggable rerank stage, off by default.** Implementations: `none` (RRF only) · `llm-listwise` (small model via LLMAPI) · `jev` (TypeSafe, hosted, to evaluate) · later Voyage / Cohere / a self-hosted cross-encoder. Any external reranker falls back to RRF on timeout or error | ✅ |
| D31 | **PDF: text layer only in the MVP** (Node extraction; scanned PDFs rejected with a reason), behind a `DocumentParser` abstraction so a vision / OCR parser can be added later | ✅ |
| D32 | **Chunk context: deterministic prefix only** (breadcrumb + one-line document summary from one cheap LLM call per document); per-chunk LLM context later, only if evaluations show the need | ✅ |
| D33 | **Toggles are layered:** platform defaults (config) → workspace overrides (feature flags set by us) → Agent step settings. Builders see only safe ones (retrieval mode, allow reading whole documents); experimental stages (rerank provider, query rewrite) are flags we control | ✅ |
| D34 | **Retrieval / answer evaluation is deferred** past the MVP. Defaults and toggles are set by manual testing in the simulator; every run is traced in Langfuse, so datasets and experiments can be added later (see the research doc, §5) | ✅ |
| D35 | **`platform/` holds infrastructure with no business meaning that 2+ modules use**: config, db, context, errors, queues, outbox, pubsub, cache + rate limit, observability, llm, storage, crypto, ids + clock, testing. Single-module clients (Telegram → `channels`, email → `notifications`, auth → `identity`) stay in their module (§11.3) | ✅ |
| D36 | **IDs: UUIDv7 stored as native `uuid`, exposed with a type prefix** (`agt_…`, `kb_…`, `conv_…`; prefix + base32). Time-ordered keys for B-tree locality; self-describing ids in the API, logs and support; prefix checked when parsing input | ✅ |
| D37 | **The actor in `ctx` is a typed union:** `User` (userId, role, permissions) · `ApiChannel` (channelId) · `System` (reason: schedule, ingest, …) · later `ApiToken`. Every `ctx` also carries workspaceId, traceId, locale. `authorize()` checks permissions for users; system actors are scoped to one workspace | ✅ |
| D38 | **Layering: transport → use case → service → repository** (ADR 0012). Transports call one use case; use cases never call use cases; use cases and services may use services and repositories of other modules (reads and writes). Core modules export services + repositories; use cases only for their own transport modules. dependency-cruiser enforces it | ✅ |
| D39 | **One use case = one transaction, carried in CLS** (`@Transactional()`, `txHost.tx`; ADR 0013). No fire-and-forget; no transaction held across an external call (LLM, Telegram, HTTP) | ✅ |
| D40 | **Tenant isolation: repositories filter by `workspace_id` + Postgres RLS from day one** (ADR 0013). `app.workspace_id` set per transaction; roles `app_owner` / `app` / `app_system` (BYPASSRLS, only via `SystemDb` for cross-tenant system work) | ✅ |
| D41 | **Errors** (ADR 0014): `DomainError` with a fixed `kind` + stable `code`; one mapper per transport. GraphQL: thrown errors in `errors[]` with `extensions.code` / `reason` / `fields`. REST gateway: RFC 9457 problem+json. Jobs: domain errors give up, unknown / retryable upstream errors retry. User-facing EN/UK text comes from the web app by code | ✅ |
| D42 | **Jobs and events after commit; durable outbox for critical paths** (ADR 0015). `jobs.enqueue` (command, one receiver) and `domainEvents.emit` (event, `@OnDomainEvent` listeners, one job per listener) wait for the commit. `{ durable: true }` adds an outbox row + sweeper for: message → run, external event / API message → run, escalation → notify, source sync / re-index. At-least-once; jobs safe to repeat | ✅ |
| D43 | **Job conventions:** a job carries only IDs (+ workspaceId, traceId, initiatedBy); the worker reads current data. Permissions are checked when the job is added; the job runs as a `System` actor scoped to the workspace and keeps `initiatedBy` for audit. **Bull Board** in `api`, platform admins only; Grafana for queue metrics | ✅ |
| D44 | **Pub/sub:** typed topic classes (`ConversationMessagesTopic(id)`), never raw strings; small events (what changed + id), the client refetches; a subscription authorizes through a use case; published after commit. In code, Redis pub/sub channels are called **topics** | ✅ |
| D45 | **Distributed tracing: OpenTelemetry → Grafana Tempo.** One timeline per request across gateway → queue → worker → DB / Redis / LLM / Telegram; trace context travels in job payloads; logs carry `traceId` and link to Tempo. Langfuse keeps the LLM-level detail | ✅ |
| D46 | **Remaining `platform/` defaults** (§11.3): env-only config validated by zod per role; `SecretBox` (AES-256-GCM, env key on the homeserver / KMS on AWS, key version per row; API keys hashed); `LlmGateway` + `EmbeddingGateway` with tracing (Langfuse when on), metrics, timeouts, retries; `FileStorage` (MinIO / S3); `Cache` + Redis token-bucket `RateLimiter`; workspace feature flags in Postgres, cached in Redis, admin-only; `IdService` + `Clock`; Testcontainers, rollback per test, shared fakes and factories | ✅ |
| D47 | **LLM observability** (ADR 0016): **traces live in Langfuse in the MVP** (trace = run, session = conversation; spans via OpenTelemetry → OTel Collector; trace ID stored on the run). `LANGFUSE_MODE = off \| cloud \| self-hosted` + a sample rate; the product never needs it to run. MVP/demo: **self-hosted Langfuse on the homeserver** (needs the RAM upgrade to ≥ 32 GB); **Langfuse Cloud Hobby is the fallback** with no code change. Sampled or off during load tests. "Open in Langfuse" for platform admins only. **Customers' prompts in Postgres; internal platform prompts in code.** Every LLM call tagged with prompt id + version, agent version, workspace. No prompt mirror | ✅ |
| D48 | **Our own run traces are an optional MVP item (only if time allows):** `run_steps` + `run_spans` (one table, `kind` = llm · tool · retrieval · http; parent, timing, tokens, cost, prompt version, JSONB payloads kept 30 days) powering the whole Traces page. **When it ships, Langfuse is removed as a dependency.** `LlmGateway` already reports each model round and tool call, so only storage and UI remain (ADR 0016) | ⏸ optional |
| D49 | **Web app: Vite + React SPA**, TypeScript; static build served by nginx (homeserver) / CloudFront + S3 (AWS). No SSR: the app is behind login and needs no SEO | ✅ |
| D50 | **Routing: TanStack Router** (type-safe routes, params and zod-validated search params; filter state lives in the URL) | ✅ |
| D51 | **GraphQL client: Apollo Client** (normalized cache, graphql-ws subscriptions, refetch on "what changed" events). Operations in `.graphql` files next to each feature; codegen `near-operation-file` + `typed-document-node` → `x.generated.ts`, used as `useQuery(Doc)` | ✅ |
| D52 | **i18n: i18next + react-i18next**: typed keys, ICU plurals (Ukrainian has 3 forms), lazy namespaces per feature; API error codes map to keys (ADR 0014) | ✅ |
| D53 | **React code is functional:** function components, hooks, pure helpers. The "classes everywhere" rule (D24) applies to the backend | ✅ |
| D54 | **Web structure: `features/<feature>/` with layers as hooks + containers** (§11.4): `communication/` (operations + data hooks, API types → frontend types) · `logic/` (behaviour hooks, pure helpers) · `storage/` (optional zustand / context) · `view/` (presentational) · `containers/` (wire hooks into views, one per screen or independent panel) · `index.ts` (public API). Thin TanStack `routes/` at app level. Direction enforced by dependency-cruiser (D79). | ✅ |
| D55 | **Styling:** design tokens (color, spacing, type, radius, shadow) as CSS variables from our design; components styled with **CSS Modules (`.module.scss`)**; **Tailwind only for layout** (flex / grid / gap / spacing / sizing), its theme mapped to the same tokens; **Radix primitives only inside `shared/ui`** for complex accessible widgets (dialog, dropdown, popover, select, tooltip, tabs). Features use `shared/ui`, never Radix directly | ✅ |
| D56 | **Flow builder canvas: React Flow (`@xyflow/react`)**; custom nodes are React components; the graph lives in the flow-builder `storage/` (zustand); graph rules in `logic/` on top of `@agent-ic/flow` | ✅ |
| D57 | **Forms: TanStack Form + zod**; schemas shared with the backend where it makes sense; API field errors (ADR 0014 `fields`) mapped onto inputs | ✅ |
| D58 | **Web testing:** Vitest + React Testing Library (hooks, view components; Apollo MockedProvider for communication hooks), **Storybook from day one** (`shared/ui` and view components), Playwright e2e for key flows against a booted stack | ✅ |
| D59 | **Browser auth: JWT access + refresh tokens.** Access token (~15 min) kept in memory, sent as `Authorization` on HTTP and in graphql-ws `connection_init`; it carries identity only (userId, sessionId), so roles and workspace membership are loaded per request and changes apply at once. Refresh token in a `Secure; HttpOnly; SameSite=Strict` cookie scoped to `/api/auth/refresh`, **rotated on every use with reuse detection**; refresh sessions stored hashed in Postgres, so logout / password change / "sign out everywhere" revoke them. Apollo: on `UNAUTHENTICATED`, refresh once and retry; one refresh at a time across tabs (Web Locks API). On token expiry the WS server closes the socket and the client reconnects with a fresh token | ✅ |
| D60 | **Web runtime config:** build once; nginx serves `/config.json` rendered from Helm values; the app loads and zod-validates it before rendering. No per-environment builds | ✅ |
| D61 | **Web naming:** folder per component in PascalCase (`view/RunList/RunList.tsx` + `.module.scss` + `.stories.tsx` + `.test.tsx` + `index.ts`); hooks `useX.ts`; helpers camelCase | ✅ |
| D62 | **Web client state:** server data only in Apollo's cache; filters, tabs and selection in URL search params; component-only state in `useState`; shared client state (flow builder graph, undo / redo, selection) in **zustand** stores in `storage/` | ✅ |
| D63 | **Environments: local (docker compose) + one homeserver environment.** No staging or per-PR previews on the single node; they come with AWS | ✅ |
| D64 | **Repo visibility:** app repo `agent-ic` **public** (free unlimited Actions minutes, public GHCR images and chart); deploy repo `agent-ic-deploy` **private** (topology, tunnel IDs; secrets encrypted in it anyway). Argo CD reads it with a deploy key; app CI pushes version bumps with a GitHub App token | ✅ |
| D65 | **Releases and deploys:** conventional commits + **release-please** (changelog, `vX.Y.Z` tags). **Every merge to main** builds image + chart `X.Y.Z-main.<n>` and CI commits the bump to `envs/homeserver`; Argo CD syncs. A **freeze switch** (repo variable) stops auto-deploys before a demo, and a release is pinned instead | ✅ |
| D66 | **CI runners: GitHub-hosted only.** Safe for fork PRs on the public repo; Docker available for Testcontainers. Load tests and in-cluster e2e run as on-demand Kubernetes Jobs, not CI runners | ✅ |
| D67 | **Homeserver secrets: Sealed Secrets.** Encrypted with `kubeseal`, committed to the private deploy repo, applied by Argo CD. The controller's key is backed up outside the cluster. The chart only references Secrets by name, so AWS can use External Secrets later without chart changes | ✅ |
| D68 | **Homeserver bootstrap: Ansible playbook** in `agent-ic-deploy/bootstrap/`: k3s (`--disable traefik --disable servicelb`), storage paths (SSD vs `/mnt/data` HDD), sysctl, then Argo CD + the root app-of-apps; afterwards Argo CD manages everything, including itself | ✅ |
| D69 | **No Terraform until the AWS move.** The Cloudflare tunnel and DNS records (a handful) are created by hand and documented in the deploy repo; `terraform/` is added with AWS | ✅ |
| D70 | **Backups: on the HDD only, for the MVP.** CloudNativePG (Barman) writes WAL + nightly base backups to a `backups` bucket in MinIO on `/mnt/data`; a nightly CronJob copies the upload buckets. Protects against mistakes and SSD failure, **not against losing the machine**; moving offsite later (R2 / B2) is a config change | ✅ |
| D71 | **App CI** (GitHub Actions): `ci.yml` on PRs + main: install (cached) → Turborepo affected tasks → oxlint (incl. type-aware) + oxfmt check → dependency-cruiser (boundaries) → typecheck → unit tests → backend integration tests (Testcontainers) → schema print + graphql-inspector vs main → codegen up to date → migrations committed (drizzle-kit check) → boot test (resolver bindings) → web + Storybook build → `helm lint` + kubeconform → Docker builds (no push on PRs). `release.yml` on main: push `backend` / `web` images (amd64) + OCI chart `X.Y.Z-main.<n>`, Trivy scan, bump `envs/homeserver` unless frozen; release-please for `vX.Y.Z`. **Playwright e2e only on the release PR** (docker compose stack with mock LLM / Telegram). No nightly e2e, no Renovate, no CodeQL for now | ✅ |
| D72 | **Argo CD:** app-of-apps in sync waves (operators → data → observability + Langfuse → app); automated sync with self-heal and prune. **Migrations run as a PreSync hook Job** (`backend migrate`, `app_owner` role); always expand-then-contract. Deploy repo CI: YAML lint + kubeconform | ✅ |
| D73 | **Placement:** local-dev `compose.yaml` (Postgres + pgvector, Redis × 2, MinIO, mock LLM, mock Telegram; optional Langfuse / observability profile) and `e2e/` live in the **app repo**; our Grafana dashboards (ConfigMaps) and PrometheusRules ship **inside the Helm chart** | ✅ |
| D74 | **No cert-manager on the homeserver:** HTTPS ends at Cloudflare, and `cloudflared` → Traefik stays inside the cluster. Back with AWS (or ACM there) | ✅ |
| D75 | **Shared packages are built with tsup** to `dist` (CJS + ESM; declarations by `tsc`, D94); Node (backend runtime, Docker image) uses `dist`. A custom **`source` export condition** points Vite, Vitest and `tsc` at `src/`, so package edits apply instantly in dev and tests. Turbo builds packages before apps | ✅ |
| D76 | **Types that cross the API come from the GraphQL schema** (codegen on both sides). Shared packages hold only what both sides must execute or what GraphQL can't type: the role → permission matrix (UI gating), plan limits, error codes (ADR 0014 reasons → i18n), ID prefixes (D36), flow rules | ✅ |
| D77 | **Flow format changes rewrite stored flows** with a data migration (TypeScript, idempotent, recorded in a migrations table). Every flow keeps a `schemaVersion`; the engine refuses a version it doesn't know. To keep deploys safe: the data migration runs as a **PostSync** job (after new pods are up), and the new code reads the previous and the current format for that one release | ✅ |
| D78 | **Package names:** `@agent-ic/api-schema` (generated schema), `@agent-ic/flow` (flow zod schema, graph validation, template `{{…}}` parser for builder autocomplete and engine interpolation), `@agent-ic/contracts` (permission matrix, limits, error codes, ID prefixes), `@agent-ic/tsconfig` + `@agent-ic/oxc-config` (shared `.oxlintrc.json` + oxfmt config). Replaces D20's `flow-schema` / `domain` / `config` | ✅ |
| D79 | **Lint and format: oxlint + oxfmt** (Oxc toolchain), shared config in `@agent-ic/oxc-config`. Oxlint's built-in rules (core, TypeScript, React, react-hooks, jsx-a11y, import incl. `no-cycle`, unicorn, vitest) plus **type-aware rules via tsgolint**, switched on with `options.typeAware` in the shared oxlint config (`no-floating-promises`, `no-misused-promises`; alpha, switched off if it gets in the way). `consistent-type-imports` is off for `apps/backend`, where it would break NestJS constructor injection metadata. **All architecture rules live in dependency-cruiser** (backend modules and layers, ADR 0012; web features and layers, D54), independent of the linter. No ESLint, no Prettier | ✅ |
| D80 | **Naming:** the `api` role keeps its name, and the product channel is always written in full ("API channel", `ApiChannel`, `api-channel`). "Event" is always qualified: **domain event** (internal, `domainEvents.emit`, `@OnDomainEvent`) vs **external event** (the product trigger, `ExternalEvent`). The run-queue Deployment is **`worker-runs`** (was `worker-runtime`; the `runtime` module keeps its name). The app namespace is **`agent-ic`** (was `app`). Redis pub/sub channels are "topics" (D44); package names per D78 | ✅ |
| D81 | **LLM providers are one abstraction:** the platform's LLMAPI account is the **default provider**, on the same level as providers a workspace adds with its own key. Every Agent / Completion step stores **provider + model**; no "Strong / Fast" tiers. The platform provider offers a **curated list of ~6–8 tested models** (tools, structured output, Ukrainian, latency) with prices, fallbacks and one default each for Agent and Completion steps, all in config | ✅ |
| D82 | **Metering in credits = provider cost:** each platform-provider call costs `in_tokens × in_price + out_tokens × out_price` from the price table; **1 credit = $0.001**. One monthly credit limit per workspace (`UsageCounter.model_units`). Calls on a workspace's own keys are not counted | ✅ |
| D83 | **Fallback per platform model:** each curated model has a fallback from another vendor; `LlmGateway` retries once on it for 429 / 5xx / timeout, and the trace records which model answered. Workspace-owned providers have no fallback in the MVP | ✅ |
| D84 | **Bring-your-own-key providers in the MVP:** OpenAI, Anthropic, Google (Gemini) and a generic **OpenAI-compatible** provider (base URL + key: LLMAPI, OpenRouter, Groq, vLLM, Ollama…). Keys checked on save, encrypted with `SecretBox`, never shown again (scope §12.14) | ✅ |
| D85 | **Email: Resend** behind `EmailGateway` (in the `notifications` module); templates as React Email components; local dev catches all mail in **Mailpit** (docker compose). Sender domain verified with DNS records in Cloudflare | ✅ |
| D86 | **Domain: `agent-ic.pavlop.dev`** for the app (Traefik: `/` → web, `/api` → api, `/v1` + `/webhooks` → gateway); email sent from `mail.agent-ic.pavlop.dev`. Admin UIs (Argo CD, Grafana, Langfuse, Bull Board) get their own subdomains that are **reachable only over the homeserver's WireGuard VPN** (an internal `dnsmasq` `address=` line per host, same as the other homeserver apps; no public DNS route). Only the app and the webhooks are public through the Cloudflare Tunnel | ✅ |
| D87 | **Workspace in the URL:** `/w/:workspaceId/…`; the Apollo link sends `x-workspace-id` from the route; the backend checks membership on every request | ✅ |
| D88 | **GraphQL lists use cursor connections** (Relay style: `edges`, `pageInfo { endCursor, hasNextPage }`, opaque cursors over time-ordered UUIDv7 ids); Apollo `relayStylePagination` on the client | ✅ |
| D89 | **Light theme only in the MVP**; all colours are semantic CSS variables, so dark mode later is one more token set | ✅ |
| D90 | **Curated platform models** (smoke test 2026-10-04: KB tool call + final reply in Ukrainian, all passed). Conversation: `gpt-5.4-mini` (**default**, ~2.1 s per turn), `claude-sonnet-5-5`, `gpt-6.1-sol`, `gemini-3.8-flash`, `deepseek-v4.1-flash`. Light: `gemini-3.5-flash-lite` (**default**, ~2.2 s), `gpt-5.6-luna`, `gpt-5.4-nano`. Fallbacks (other vendor): mini ↔ gemini-3.8-flash, sonnet ↔ sol, deepseek → gemini-3.8-flash, flash-lite ↔ luna, nano → flash-lite. Dropped: `claude-haiku-4-5` (price, wraps JSON in fences), `mimo-v2.6-flash` (empty replies). The list is config, not code | ✅ |
| D91 | **Structured output goes through a final `reply` tool**, not `response_format`. Through LLMAPI, Claude models ignore `json_schema`, DeepSeek rejects it, and Sonnet 5.5 rejects a forced `tool_choice`; a `reply` tool with `tool_choice: auto` worked on every curated model. `LlmGateway` validates the arguments with zod and retries once with the validation error; a plain-text answer counts as a failed step. Completion steps use the same tool (one round, no other tools) | ✅ |
| D92 | **Operations that issue or revoke a session are REST under `/api/auth/*`; everything else is GraphQL** | ✅ |
| D93 | **Passwords: argon2id** (`@node-rs/argon2`), minimum 10 characters | ✅ |
| D94 | **Shared package declarations come from `tsc`:** tsup builds the JS (CJS + ESM) and `tsc -p tsconfig.build.json --emitDeclarationOnly` emits the `.d.ts`, because tsup's dts bundler does not support TypeScript 7 (amends D75) | ✅ |
| D95 | **Toolchain and local dev:** mise pins the tools (node 24, pnpm, mkcert, kubectl, helm, kubeseal, actionlint) and runs the tasks; the whole local stack runs in Docker with local HTTPS at `local.agent-ic.pavlop.dev` (mkcert + Traefik); the oxfmt config is passed with `-c` from `@agent-ic/oxc-config` because oxfmt has no `extends` | ✅ |
| D96 | **Backend build and dev toolchain is SWC:** Nest DI needs `emitDecoratorMetadata`, and the Nest CLI needs the TypeScript compiler API, which TypeScript 7 does not ship. `swc` compiles `src` to `dist` (`.swcrc`: legacy decorators, decorator metadata, `@/` alias rewritten to relative paths, imports resolved fully); dev is `nodemon` (rebuild + restart); tests are Vitest with `unplugin-swc`; `tsc --noEmit` only type-checks. Imports are extensionless (`moduleResolution: Bundler`) | ✅ |
| D97 | **The role and the ports are never hardcoded:** the role is the CLI argument `--role=api\|gateway\|worker`, a worker also takes `--queues=a,b` (validated against the `QueueName` enum); both are validated by zod in `platform/config` together with the env, in per-role sections (only the chosen role's variables are required: `API_PORT`, `GATEWAY_PORT`, `WORKER_PORT`, all from `.env` through compose). Invalid input lists every bad variable on stderr and exits with code 1 | ✅ |
| D98 | **Every role is an HTTP process** (amends D22): a worker also listens, with health and metrics only and no business routes. `api` serves `/api/health/*` under the global prefix `/api`; `gateway` and `worker` serve `/health/*`; `/metrics` is outside the `/api` prefix, so Traefik, which routes only `/api`, `/v1` and `/webhooks`, never exposes it. Readiness turns 503 when shutdown begins; SIGTERM closes the server gracefully | ✅ |
| D99 | **Observability start-up order:** the OpenTelemetry SDK (HTTP and Express instrumentation, OTLP traces only) starts before the Nest module graph is imported (dynamic import in `ApplicationLauncher`), so the instrumentation can patch; `OTEL_SDK_DISABLED` switches it off. Metrics are only Prometheus (`prom-client`, one registry per process, `role` label); logs are pino JSON with `traceId`; health and metrics requests are neither logged nor traced | ✅ |
| D100 | **No hardcoding and one file per kind** (`docs/rules/code.md` 13 and 14): enums and named constants instead of magic values, config only from env through the zod config, no env values in scripts; types in `<name>.typedefs.ts`, constants and enums in `<name>.constants.ts`, pure helpers in `<name>.helpers.ts`, zod schemas in `<name>.schema.ts`. Platform operational controllers (health, metrics) may call platform services directly; the transport-to-use-case rule applies to `modules/` | ✅ |

---

## 2. What drives the architecture

Most of the product is ordinary CRUD. These requirements shape the system:

1. **Flow runs.** Short jobs (seconds) that must survive restarts, retry steps with backoff, run Parallel branches, and finish on the version they started on.
2. **Ingress.** Telegram webhooks and the API channel must be accepted fast, de-duplicated (by `update_id` / message id) and handed to a worker. The API channel's "wait for result" mode blocks for up to 30 s.
3. **Ordering within one conversation.** Several quick messages from one customer must not start runs that compete with each other.
4. **Knowledge ingestion.** Fetch → parse → chunk → embed → index is slow and memory-heavy. A re-sync replaces a source's chunks in one step.
5. **Timers.** Cron triggers, scheduled KB syncs, escalation reminders (5 min / 30 min), the 24 h grace period on rotated API keys.
6. **Outbound delivery.** Telegram limits (≈1 msg/s per chat, ≈30 msg/s per bot); retries for webhook delivery to API channels.
7. **Realtime UI.** Inbox updates and the simulator's live step trace.
8. **Multi-tenancy.** Everything is scoped to a workspace; permissions are enforced on the server.

---

## 3. System overview

```
 Telegram ─┐                        ┌──────────────┐
 API chans ┼──▶ ┌──────────────┐    │ web: React   │
 KB hooks  ┘    │ gateway      │    │ SPA (Vite)   │
                │ check, dedupe│    └──────┬───────┘
                │ save, enqueue│           │ GraphQL + WS
                └──────┬───────┘    ┌──────▼───────┐
                       │            │ api          │
                       │            │ GraphQL API  │
                       ▼            └──┬────────┬──┘
          ┌──────────────┐◀────────────┘        │ SQL
          │ Redis        │                      ▼
          │ BullMQ +     │      ┌────────────────────┐   ┌──────────┐
          │ pub/sub      │      │ Postgres + pgvector│   │ S3/MinIO │
          └──────┬───────┘      │ (via PgBouncer)    │   │ uploads  │
                 ▼              └────────────────────┘   └──────────┘
   ┌───────────────────────┐           ▲
   │ worker-runs        │───────────┘──▶ LLM providers (platform / BYOK)
   │ runs, outbound,       │──────────────▶ Telegram, client webhooks, SMTP
   │ notify, timers        │──────────────▶ Langfuse
   ├───────────────────────┤
   │ worker-ingest         │──────────────▶ Google Docs, ClickUp, embeddings
   └───────────────────────┘
 Prometheus ◀── /metrics (all Deployments, BullMQ, pg/redis exporters) ──▶ Grafana
```

### 3.1 Process roles (Deployments)

All roles run from **one image** with different entrypoints, so every role always runs the same version.

| Deployment | Does | Limited by | Scales on | Replicas |
|---|---|---|---|---|
| `gateway` | **Machine-to-machine ingress:** Telegram webhooks, `POST /v1/channels/{id}/messages` and `/events`, KB source change webhooks (Google / ClickUp), KB refresh endpoint. Checks, de-duplicates, saves, enqueues; answers in < 100 ms. Holds the 30 s "wait for result" requests. | Network | HPA on CPU / RPS | 2 → N |
| `api` | **Humans through the web app:** dashboard GraphQL (queries, mutations, subscriptions over WebSocket), OAuth callbacks for connecting Google / ClickUp | Light CPU, open WebSockets | HPA on CPU + open connections | 2 → few |
| `worker-runs` | Queues `runs:reactive`, `runs:proactive`, `outbound`, `notify`, `timers` | Waiting on the LLM | KEDA on queue wait time / depth + KEDA cron pre-scale | 2 → N |
| `worker-ingest` | Queue `ingest` (KB sync pipeline) | CPU and memory | KEDA on queue length | **0** → N |

Customer traffic (`gateway`) never shares pods with the dashboard (`api`), and a large PDF import never shares pods with live conversations.

The **`web`** SPA is static files, built separately. It runs as a small nginx Deployment on the homeserver and from CloudFront + S3 on AWS.

### 3.2 Modules

Each module owns its own tables (one Postgres schema per module). Other modules use it only through what it exports, its services and repositories (ADR 0012); there are **no joins across module schemas**. CI enforces the boundaries with dependency-cruiser (D79).

| Module | Owns |
|---|---|
| `identity` | users, sessions, workspaces, memberships, roles, invites |
| `agents` | agents, versions (flow JSON), publish / restore |
| `prompts` | prompts, versions, folders |
| `knowledge` | KBs, sources, chunks, embeddings, connectors, sync |
| `channels` | Telegram / API channels, adapter layer, keys |
| `runtime` | the flow engine, runs, run steps, LLM calls |
| `conversations` | conversations, messages, escalations, Inbox |
| `notifications` | in-app / email / Telegram alerts bot, notification settings |
| `analytics` | aggregates for the Analytics page |
| `usage` | monthly counters, limits, BYOK keys |

These boundaries let us move a module into its own service later by giving it an image and replacing in-process calls with HTTP or queue calls. The likely first candidates:
- **ingest**: to switch to Python, which has much better document parsing;
- **gateway**: when it needs its own availability target or release schedule;
- **notifications**: when new channels bring their own SDKs.

### 3.3 Why a monolith and not microservices

Microservices let separate **teams** work and deploy independently. They don't make the system handle more **load**: per-workload scaling comes from process roles (§3.1), which a monolith has too. Microservices would cost us:
- synchronous calls or copied data on the hot path, because the flow engine reads agents, prompts, KBs, channels, conversations and usage;
- sagas for operations that cross services;
- versioned contracts between services;
- N pipelines and charts;
- a higher idle cost.

With 3 people, that trade is not worth it.

### 3.4 API surfaces

| Surface | Style | Served by | Consumers |
|---|---|---|---|
| Dashboard / management API | **GraphQL, schema-first** | `api` | Our web app now; the public API, external scripts and agents later |
| Realtime | **GraphQL subscriptions** over WebSocket (`graphql-ws`) | `api` | Inbox, simulator live trace, Agents "needs attention" |
| Channel ingress | **REST + webhooks** | `gateway` | Telegram (webhooks), businesses' systems (API channel `POST /v1/channels/{id}/messages`, `/events`) |

**The schema-first workflow:**

```
apps/backend/src/modules/<m>/<m>.graphql      SDL, written next to the resolvers
        │  codegen (typescript-resolvers) → resolvers are type-checked against the schema
        │  turbo: backend#schema:print
        ▼
packages/api-schema/schema.graphql            merged schema; GENERATED, gitignored
        │  codegen (client)
        ▼
apps/web/src/features/**/<name>.graphql       operations next to the feature
        → __generated__/ typed documents + hooks
```

- **Not committed.** Turbo builds `api-schema` from the backend's SDL before any consumer's codegen, so the web app depends on a package, never on server source. A root `graphql.config.ts` gives editors schema autocomplete without a build.
- **Breaking-change check:** CI builds the schema for both the PR and `main` and diffs them with graphql-inspector.
- **Server rules:**
  - DataLoader per request for every relation (no N+1);
  - limits on query depth and complexity;
  - permission checks in the resolver or service layer, never only in the UI;
  - trusted (persisted) documents are an option while our web app is the only client.
- **Later:** if the public API ships, CI publishes the schema to a registry (Hive or Apollo GraphOS) on release.

**Subscriptions across replicas.** A WebSocket is pinned to one `api` pod, but events start in any process (`worker-runs`, `gateway`, another `api` pod).
- Every publisher writes to **Redis pub/sub**. Every `api` pod subscribes and forwards events to its own clients, after checking auth and filters.
- Channels are scoped to keep fan-out small: `ws:{workspaceId}:inbox`, `conv:{conversationId}:messages`, `run:{runId}:steps`.
- Events say **what changed**; queries are the source of truth. Redis pub/sub is fire-and-forget, so after a reconnect (`graphql-ws` retries with backoff) the client refetches its queries.
- Keepalive pings every ~20 s stay under the idle timeouts of the ALB, Traefik and Cloudflare Tunnel.
- The `api` Deployment scales on open connections as well as CPU.

---

## 4. Messaging

| Mechanism | Used for |
|---|---|
| **BullMQ queues** | All background work: runs, outbound delivery, notifications, ingestion, timers. Persistent jobs, retries with backoff, delayed jobs, job schedulers (cron). |
| **Redis pub/sub** | Live updates only: fanning out GraphQL subscription events across `api` replicas, and waking a `gateway` request that waits for a run's result. Nothing that must not be lost. |
| **After-commit dispatch + durable outbox** | Use cases call `jobs.enqueue` / `domainEvents.emit`; the platform sends them after the commit. Critical paths add `{ durable: true }`: an outbox row in the same transaction + a sweeper that re-sends it if the dispatch failed (ADR 0015). |

**Queues:**
- `runs:reactive`: a customer is waiting. Highest priority.
- `runs:proactive`: cron and external-event runs. Capped per workspace so one tenant's bulk run can't starve live chats.
- `outbound`: deliveries to Telegram and API-channel webhooks. Uses a token bucket in Redis **per bot**.
- `notify`: email, Telegram alerts, in-app.
- `timers`: escalation reminders, key-rotation expiry, schedule-trigger ticks.
- `ingest`: one job per source sync.

**Redis instances:** BullMQ requires `maxmemory-policy noeviction`, while a cache wants eviction (e.g. LRU). So we run two logical Redis instances: one for `queue` and one for `cache`.

---

## 5. Flow engine

- **The flow JSON schema** lives in `@agent-ic/flow` (zod). The builder uses it for validation before publish; the engine uses it for execution. It is the most important contract in the system.
- **A run is one job; every step's result is saved** to `run_steps`. A retried job skips steps that already finished.
- **Send-message steps** record the outbound message with an idempotency key before sending, so a customer never gets a message twice.
- **One run per conversation at a time:**
  - an incoming message is saved first;
  - if the conversation has an `active_run_id`, no new run starts;
  - when a run ends, it checks for newer messages and starts one run covering all of them.

  This gives ordering and merges rapid-fire messages into one run.
- **Escalation pauses the conversation, not the run.** The run ends and the conversation becomes `waiting`. After a hand-back, the next message starts a new run.
- **Optional later (D48):** our own run traces (`run_spans` under `run_steps`) and the Traces page; then Langfuse is dropped.
- **Version pinning:** `run.version_id` is set when the run is created, so publishing never affects runs already in progress.
- **Tracing (D47):** trace = run and session = conversation in Langfuse; steps are spans, LLM calls are generations; the run stores the trace ID. Langfuse can be switched off without affecting runs.
- **Later (vision):** Wait nodes and inactivity timers become "save state, then a delayed job resumes the run". If durable long-running workflows become central, Temporal is the upgrade path.

---

## 6. Data

- **Postgres** with one schema per module, behind **PgBouncer** (transaction mode). The number of connections grows with the number of pods, so PgBouncer is needed from day one.
- **pgvector** exact search scoped to the agent's KBs (no global HNSW; ADR 0011). A re-sync writes a new generation of chunks and flips it in one transaction, so agents never see a half-indexed source.
- **Tenancy:** a `workspace_id` column on every tenant row, filtered in repositories **and** enforced by Postgres row-level security (D40, ADR 0013).
- **Object storage:** the S3 API only (MinIO on the homeserver, S3 on AWS) for uploaded files.
- **Analytics** read from our own tables; later from a read replica.
- **Migrations:** run as a Kubernetes Job (Helm pre-upgrade hook), always as expand-then-contract steps for zero-downtime deploys.

---

## 7. Scaling

**What limits throughput, in the order we'll hit it:**
1. **LLM provider rate limits** (requests / tokens per minute). Handled with priority queues, per-tenant fair sharing and backoff. More pods don't help.
2. **Postgres connections and writes.** PgBouncer now; a read replica for analytics later.
3. **Telegram per-bot limits.** A token bucket per bot.
4. **Noisy neighbours.** Reactive and proactive traffic in separate queues, plus per-workspace concurrency caps.
5. **Redis.** Far away.

**Autoscaling:**
- Workers spend most of each run waiting on network calls, so CPU is a poor signal. **KEDA** scales on queue wait time and depth from Prometheus.
- **KEDA cron** scales up before business-hours peaks.
- Pods start in seconds; new nodes take about 1 min (Karpenter on AWS), so we keep a warm minimum.

**Rules that keep scaling safe:**
- **No state in processes.** Subscription events and run-result waiting go through Redis pub/sub; sticky sessions are never needed.
- **Graceful shutdown.**
  - On SIGTERM, workers call `worker.close()` so in-flight jobs finish.
  - `terminationGracePeriodSeconds` (≈ 90 s) is longer than the longest run.
  - BullMQ's stalled-job recovery handles pods that are killed hard.
- **Rate limits live in Redis** (token buckets), never in a pod's memory.
- **Rolling updates** with readiness probes, migrations as described in §6, and runs pinned to their version.

---

## 8. Deployment

The app reads only environment variables (`DATABASE_URL`, `REDIS_QUEUE_URL`, `REDIS_CACHE_URL`, `S3_*`, `LANGFUSE_*`, …) and uses only the standard S3 API. Moving from the homeserver to AWS is a change to the Helm values file, not to the code.

| | Local | Homeserver (MVP) | AWS (later) |
|---|---|---|---|
| Orchestration | docker compose | **k3s** | **EKS + Karpenter** (Terraform) |
| Postgres + pgvector | Container | CloudNativePG + PgBouncer, backups to MinIO on the HDD (D70) | RDS / Aurora Postgres + RDS Proxy |
| Redis (queue + cache) | Container | In-cluster, two instances | ElastiCache (Valkey) |
| Object storage | MinIO | MinIO | S3 |
| Ingress / TLS | — | Traefik behind a **Cloudflare Tunnel** (TLS at Cloudflare; no cert-manager, D74) | Route 53 + ACM + WAF → ALB (AWS Load Balancer Controller) |
| Web SPA | Vite dev server | nginx Deployment | CloudFront + S3 |
| Node scaling | — | — (single node) | Karpenter (spot + on-demand) |
| Secrets | `.env` | Sealed Secrets (D67) | External Secrets Operator + Secrets Manager; KMS for the master encryption key |
| Delivery | — | GitHub Actions → image + Helm chart (OCI) on GHCR → **Argo CD** | GitHub Actions → ECR → Argo CD |
| Metrics / logs / traces | Optional | kube-prometheus-stack (Prometheus, Grafana, Alertmanager) + Loki + Tempo + OTel Collector, KEDA | Same, or managed Prometheus / Grafana |
| Langfuse (D47) | Off, or Langfuse Cloud | **Self-hosted Helm chart** (after the RAM upgrade): web + worker + one ClickHouse replica; its database in our CNPG cluster, a bucket in our MinIO, its own small Valkey (`noeviction`). Fallback: Langfuse Cloud (Hobby) | Langfuse Cloud or Helm on its own node group, until our own traces replace it (D48) |

**Homeserver notes:**
- Telegram webhooks need public HTTPS. A Cloudflare Tunnel provides it without exposing the home IP or opening ports.
- A single node has no high availability. Backups go to the HDD for the MVP (D70); offsite backups are needed before real customers.
- Upload bandwidth and power are the real limits on uptime; this is acceptable for the MVP.
- **Capacity (checked 2026-10-03):** Ryzen 5 3600 (6C/12T), 16 GB RAM (2 of 4 slots free, up to 128 GB), 112 GB SATA SSD + 1 TB HDD, alongside existing Coolify apps (~3 GB). CPU and disk are enough; RAM is not enough for the full stack plus a scaling demo, so **the plan is to upgrade to ≥ 32 GB** (add 2 × 8 GB matching the installed sticks, or 2 × 16 GB). Until then, Langfuse runs in the cloud. Postgres, Prometheus and images on the SSD; MinIO (uploads, Loki / Tempo data) on the HDD.
- **Coexisting with Coolify:** Coolify's Traefik holds ports 80 / 443, so k3s is installed with `--disable traefik --disable servicelb`; our Traefik is ClusterIP-only and our `cloudflared` runs in the cluster.

**Namespaces:**
- `agent-ic`: gateway, api, web, workers (D80);
- `data`: Postgres, PgBouncer, Redis, MinIO;
- `langfuse`: web, worker, ClickHouse, Valkey;
- `observability`;
- `platform`: Argo CD, KEDA, Traefik, Sealed Secrets, cloudflared.

---

## 9. Observability

- **Langfuse (MVP, admin-only):** LLM traces, tokens, cost, later evaluations; fed from OpenTelemetry through the collector; off, cloud or self-hosted per environment (D47). Users see the simulator's turn details from `run_steps`.
- **Later, optional (D48):** our own run traces in Postgres and a Traces page for users; then Langfuse is removed.
- **Prometheus metrics** (`prom-client`, `/metrics` on every Deployment):
  - HTTP latency and errors per route (gateway, api);
  - queue depth, wait time and failures per queue;
  - run duration and outcome; step failures by type;
  - LLM latency and errors per provider and model tier;
  - Telegram webhook and send errors; outbound rate-limit hits;
  - ingest job duration and failures; chunks indexed;
  - open WebSocket connections, subscription events published and delivered.
- **Exporters:** postgres_exporter, redis_exporter, PgBouncer exporter, kube-state-metrics, node-exporter.
- **Logs:** pino (JSON) → Loki. A `run_id` / `conversation_id` / `workspace_id` / `traceId` on every log line.
- **Traces:** OpenTelemetry SDK (HTTP, GraphQL, pg, ioredis, BullMQ, outgoing fetch) → OTel Collector → **Grafana Tempo** (stored in MinIO / S3). The trace context is copied into each job payload, so a worker continues the trace of the request that added the job. Grafana links logs ↔ traces ↔ metrics (exemplars).
- **Grafana dashboards:** platform overview, queues and workers, conversation runtime, ingestion, infrastructure.
- **Alertmanager:** reactive queue wait above the target, run failure rate, webhook error spikes, DB connection saturation.

---

## 10. Security

- Secrets (bot tokens, provider keys, API-request credentials) are encrypted with AES-256-GCM using a master key from the environment / KMS. They are never returned by the API.
- API channel keys are stored hashed; a rotated key stays valid for 24 h.
- Telegram webhooks are checked with `secret_token`.
- Permissions are enforced in the API on every request (a role → permission matrix scoped to the workspace).
- Rate limits on auth endpoints and on the gateway per channel.

---

## 11. Repositories and layout

Two repositories (D18):

```
agent-ic/                        app repo: pnpm workspaces + Turborepo
├── apps/
│   ├── backend/                 Node backend; entrypoints gateway | api | worker
│   └── web/                     React SPA
├── packages/
│   ├── api-schema/              merged schema.graphql, GENERATED from backend SDL (gitignored)
│   ├── flow/                    @agent-ic/flow: zod flow-graph schema, validation, template parser (D78)
│   ├── contracts/               @agent-ic/contracts: permission matrix, limits, error codes, ID prefixes
│   ├── tsconfig/                @agent-ic/tsconfig: tsconfig bases
│   └── oxc-config/              @agent-ic/oxc-config: shared oxlint + oxfmt config (D79)
├── deploy/
│   ├── docker/                  Dockerfiles (backend, web)
│   └── helm/agent-ic/           chart templates + safe defaults; published as OCI on release
├── docs/                        mvp-scope, architecture, adr/
├── tools/                       repo scripts (codegen glue, seeding, dev helpers)
├── .github/workflows/
├── graphql.config.ts            editor tooling for .graphql files
├── package.json · pnpm-workspace.yaml · turbo.json · .nvmrc
└── README.md

agent-ic-deploy/                 GitOps + platform repo
├── envs/
│   ├── homeserver/              pinned chart + image version, values
│   └── aws-prod/                (later)
├── argocd/                      Applications / app-of-apps
├── platform/                    KEDA, Traefik, Sealed Secrets, cloudflared, kube-prometheus-stack, Loki, Tempo, OTel Collector, Langfuse, CNPG
├── bootstrap/                   Ansible: k3s install, storage paths, Argo CD + root app (D68)
├── docs/                        manual steps (Cloudflare tunnel + DNS), runbooks, restore test
└── terraform/                   added with the AWS move (D69): VPC, EKS, RDS, ElastiCache
```

**Rules:**
1. Dependencies go one way: `apps → packages`. Packages never import apps; apps never import each other.
2. `web` reaches the backend only through the GraphQL API, typed from `packages/api-schema`.
3. A shared package exists only when 2+ consumers need it. Code with one consumer stays in that app.
4. Domain modules live inside `apps/backend/src/modules/*`. Their boundaries are enforced by dependency-cruiser in CI.
5. **What changes with the code lives in the app repo** (code, Dockerfiles, chart templates). **What changes with the environment lives in the deploy repo** (values, versions, add-ons, cloud infrastructure).

**Release flow:** CI pushes the image `ghcr.io/…/agent-ic:X.Y.Z` and the chart `oci://ghcr.io/…/charts/agent-ic:X.Y.Z` with the same version. Then a version-bump PR or commit in `agent-ic-deploy` pins them, and Argo CD syncs.

**Placement (D73):** local-dev `compose.yaml` and `e2e/` live in the app repo; our Grafana dashboards and alert rules ship inside the Helm chart.

### 11.1 `apps/backend` (level 2, in progress)

```
apps/backend/src/
├── main.ts                  starts the ApplicationLauncher: `--role=gateway|api|worker` → config → tracing → that role's root module
├── entrypoints/             one Nest root module per role
│   ├── gateway.app-module.ts    HTTP server + every module's HTTP transport module
│   ├── api.app-module.ts        GraphQL + WebSocket server + every module's GraphQL transport module
│   └── worker.app-module.ts     health + metrics listener (D98); the jobs transport modules for --queues=…
├── platform/                shared infrastructure Nest modules, no business logic:
│                            db, redis, queue factory + registry, pub/sub, config, logger, metrics,
│                            UseCaseCtx, base errors, abstract gateway tokens
└── modules/<module>/        domain module = one core Nest module + thin transport modules
    ├── <module>.module.ts           core: use cases, services, repositories, gateways; exports = services + repositories
    ├── <module>.graphql-module.ts   resolvers         (imported by the api root module)
    ├── <module>.http-module.ts      controllers       (imported by the gateway root module)
    └── <module>.jobs-module.ts      BullMQ processors (imported by the worker root module)
```

- **Deployments are only config:**
  - `worker-runs` = `worker --queues=runs:reactive,runs:proactive,outbound,notify,timers`;
  - `worker-ingest` = `worker --queues=ingest`;
  - splitting a worker later means a new Deployment with a different `--queues` list, not a code change.
- **A queue is a scaling unit; a job handler belongs to a module.** One queue (e.g. `timers`) can carry jobs from several modules. The registry in `platform/` maps each job name to the module that registered its handler.
- Use cases are transport-agnostic `@Injectable()` classes: `execute(ctx, input)`, permissions checked inside, dependencies in the constructor (ADRs 0009, 0010).
- **Layers:** transport → use case → service → repository. A use case never calls a use case; a transport never touches services or repositories (ADR 0012).

### 11.2 Inside a module (level 3)

Files are grouped **by type**. Names are `kebab-case.<type>.ts`; class names are PascalCase (`StartIngestionUseCase`). Tests sit next to the code.

```
modules/knowledge/
├── knowledge.module.ts            core Nest module: use cases, services, repositories, gateways
│                                  exports = services + repositories (+ use cases for its own transports)
├── knowledge.graphql-module.ts    resolvers          → imported by the api root module
├── knowledge.http-module.ts       controllers        → imported by the gateway root module
├── knowledge.jobs-module.ts       BullMQ processors  → imported by the worker root module
├── knowledge.graphql              SDL for this module (merged into packages/api-schema)
├── use-cases/                     start-ingestion.use-case.ts (+ .spec.ts), search-knowledge.use-case.ts …
├── services/                      knowledge-search.service.ts, generation.service.ts (shared by use cases, also other modules')
├── repositories/                  sources.repository.ts, chunks.repository.ts
├── gateways/                      google-docs.gateway.ts (abstract) + google-docs.http-gateway.ts, *.fake.ts
├── graphql/                       knowledge-base.resolver.ts, source.resolver.ts
├── http/                          refresh-source.controller.ts, provider-webhook.controller.ts
├── jobs/                          ingest-source.processor.ts, scheduled-sync.processor.ts
├── domain/                        entities, domain errors, constants, pure helpers
├── db/                            table definitions for this module's Postgres schema
└── index.ts                       re-exports exported services / repositories and their types
```

**Tests:**
- `*.spec.ts` sits next to the file it covers; it runs against a real Postgres, with only external gateways faked;
- end-to-end tests across modules (GraphQL or HTTP through a booted app) live in `apps/backend/test/`.

### 11.3 `platform/` (level 3)

**Rule:** infrastructure with no business meaning, used by two or more modules. Business logic never goes here; a client used by one module lives in that module and is exported if another needs it.

| Area | What it holds |
|---|---|
| `config/` | Env config validated at startup (zod); per-role sections |
| `db/` | Drizzle provider, pool (PgBouncer-safe), transaction helper, migrations runner |
| `context/` | `UseCaseCtx` + actor union (D37), built by each transport |
| `errors/` | Base domain errors + mapping to GraphQL codes, HTTP statuses, job retry / give-up |
| `queues/` | BullMQ connection, job registry (job name → owning module's handler), producer, typed payloads, retry defaults, schedulers, graceful shutdown, admin UI |
| `outbox/` | Outbox table + relay → BullMQ / pub/sub |
| `pubsub/` | Redis pub/sub with typed topics; GraphQL subscription PubSub; "wait for run result" |
| `cache/`, `rate-limit/` | Redis cache wrapper; token buckets (per bot, per provider, auth) |
| `observability/` | Logger (pino), Prometheus metrics, health checks, trace-id propagation |
| `llm/` | `LlmGateway` (AI SDK → LLMAPI / BYOK), embeddings, per-round call details (tokens, tool calls) for usage and tracing |
| `storage/` | `FileStorage` (S3 / MinIO), presigned URLs |
| `crypto/` | `SecretBox` (bot tokens, BYOK keys), key hashing |
| `ids/`, `clock/` | Prefixed UUIDv7 ids (D36); a clock abstraction for tests |
| `testing/` | Testcontainers (Postgres, Redis), base factories, fake gateways |

**Not here:** the Telegram client (`channels`), email sending (`notifications`), auth and sessions (`identity`).

**Jobs (D42, D43):**
- A job is a class: queue, name, zod schema of the payload. The processor validates the payload before it calls the use case.
- The payload holds IDs only, plus `workspaceId`, `traceId` and `initiatedBy`. The processor builds `UseCaseCtx.system(workspaceId, reason)`.
- Defaults: 5 attempts, exponential backoff from 2 s; failed jobs kept 7 days, completed jobs 1 day; `durable` paths per ADR 0015.
- Graceful shutdown: on SIGTERM the worker stops taking jobs and waits for running jobs (`worker.close()`), within the pod's termination grace period.
- Bull Board is mounted in `api` behind the platform-admin guard.

**Pub/sub (D44):** typed topic classes, small "what changed" events and a client refetch, authorization through a use case on subscribe, publish after commit.

**Other areas (D46):**

| Area | Convention |
|---|---|
| config | Env variables only, validated by zod at startup; the process stops on an error. Each role validates only its section. Secrets from Kubernetes Secrets (homeserver) / External Secrets (AWS) |
| crypto | `SecretBox`: AES-256-GCM for bot tokens and BYOK keys; key from an env secret (homeserver) or KMS (AWS); key version stored per row for rotation. API keys stored as hashes only |
| llm | `LlmGateway`, `EmbeddingGateway` (AI SDK → LLMAPI or BYOK): every call is traced (Langfuse when on) and tagged (prompt id + version, agent version, workspace); each round's tokens and tool calls are reported for usage and future own traces; Prometheus metrics, timeouts and retries |
| storage | `FileStorage`: upload, download, delete, presigned URL; MinIO / S3 |
| cache, rate-limit | `Cache` (get / set / TTL / get-or-load) on the cache Redis; `RateLimiter` (Redis token bucket) per bot, per provider, per login |
| feature flags | Workspace overrides (D33) in a Postgres table, cached in Redis; set by platform admins only |
| ids, clock | `IdService` (prefixed UUIDv7, D36); `Clock.now()` for tests |
| testing | Testcontainers Postgres + Redis once per run; rollback per test; shared fake gateways and data factories |

### 11.4 `apps/web` (level 2–3)

```
apps/web/src/
├── main.tsx                 mounts the app
├── app/                     providers (Apollo, i18n, router, auth session), error boundary, layouts
├── routes/                  TanStack Router route files: validate params / search params (zod), pick a layout,
│                            render a feature container. No logic
├── features/<feature>/      agents, flow-builder, prompts, knowledge, channels, inbox, testing, traces,
│   │                        analytics, settings, auth, quick-start …
│   ├── communication/       x.graphql + x.generated.ts; data hooks (useRuns, useRun, useRunUpdates);
│   │                        API types → frontend types (null, never undefined); no JSX
│   ├── logic/               behaviour hooks (useTraceFilters) and pure helpers (buildSpanTree); no data fetching
│   ├── storage/             optional: zustand stores / context for state shared across components
│   ├── view/                presentational components: props in, events out; may read storage selectors
│   ├── containers/          one per screen or independent panel: calls communication + logic hooks,
│   │                        composes view components
│   └── index.ts             public API: what routes and other features may import
└── shared/                  ui (design-system components), lib (helpers), api (Apollo client, links, error mapping),
                             i18n, hooks; no feature knowledge
```

**Import rules** (dependency-cruiser, CI; D79):
- `routes` → feature `index.ts` and `shared`;
- `containers` → `communication`, `logic`, `storage`, `view` of the same feature;
- `communication`, `logic` → `shared` (and `logic` → `storage`);
- `view` → `view`, `storage` (read), `shared/ui`;
- `storage` → nothing in the feature;
- another feature → only its `index.ts`; `shared` → never a feature.

**Apollo client (`shared/api`):**
- link order: error link (on `UNAUTHENTICATED`: refresh once and retry; other errors → typed `AppError` whose `reason` maps to an i18n key; `INTERNAL` shows the traceId) → auth link (`Authorization`, `x-workspace-id` from the route) → split: subscriptions → graphql-ws link (token in `connection_init`, reconnect with a fresh token), everything else → HTTP link (`/api/graphql`);
- cache: prefixed ids are globally unique, so entities normalise by `id`; lists use `relayStylePagination` (D88);
- live updates: a `useLiveRefetch(subscription, variables, queries)` hook refetches the listed queries when an event says what changed (ADR 0006).

**Routes** follow the MVP screens under `/w/:workspaceId/` (D87): `agents`, `agents/:agentId` (flow builder), `prompts`, `knowledge`, `channels`, `inbox/:conversationId?`, `testing`, `analytics`, `settings/*`, `quick-start`; auth routes (`/login`, `/signup`, `/invite/:token`, `/reset`) sit outside it.

**Why containers instead of a Communication → Logic → View component chain:** screens like Traces, Inbox and the flow builder have several independent panels with their own data. A container per panel avoids long prop chains and keeps re-renders local.

---

## 12. Open questions

_None right now._ (The curated model list is settled in D90.)
