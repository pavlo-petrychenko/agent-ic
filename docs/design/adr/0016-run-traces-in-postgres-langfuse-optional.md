# 0016. LLM traces in Langfuse for the MVP; our own run traces later

- **Status:** Accepted; amended 2026-10-04: the MVP self-hosts Langfuse on the homeserver after a RAM upgrade, with Langfuse Cloud as the fallback (architecture.md D47, §8)
- **Date:** 2026-10-03

## Context
- The team needs to see how a run worked: steps, each LLM call (input, output, tokens, cost, latency), tool calls, and the prompt version. The full-vision design has our own **Traces** page for this.
- Building that page ourselves costs roughly 3–4 weeks of one developer's work. Langfuse gives most of the view with no UI work.
- **Langfuse limits:**
  - one project holds all tenants, so customers can't safely be given access;
  - deleting a workspace leaves its traces in Langfuse;
  - self-hosting needs ClickHouse (~1.5 GB+ RAM on a 16 GB homeserver);
  - the free cloud tier (Hobby) gives 50k units per month (~5,000 runs), 30 days of history, 2 users and 30 API requests/min.
- The prompt library is a product feature (folders, versions, pinning, "where used", roles, RLS), so prompts can't live in Langfuse.

## Decision
1. **MVP: LLM traces live in Langfuse.**
   - Trace = run, session = conversation; steps are spans, LLM calls are generations.
   - The run stores its trace ID.
   - Spans come from OpenTelemetry (AI SDK telemetry + our step spans) through the OTel Collector.
   - The MVP and the demo use **Langfuse Cloud Hobby**; self-hosting stays possible.
2. **The product never depends on Langfuse to run.**
   - `LANGFUSE_MODE = off | cloud | self-hosted`, plus a sample rate.
   - When it is off, bots work normally; only the trace view is missing.
   - Load tests run sampled (~1%) or with it off.
3. **"Open in Langfuse" is visible to platform admins only,** because the project is shared by all tenants. In the demo, that's our team.
4. **What users see in the MVP:** the simulator's turn details from `run_steps` (steps run, guard and agent output, knowledge used, duration), as already in the scope. Tokens and cost per workspace come from our own `usage` data, not from Langfuse.
5. **Prompts:**
   - customers' prompts live in Postgres;
   - internal platform prompts live in code, versioned by git;
   - every LLM call is tagged with prompt id + version, agent version and workspace;
   - no mirror of prompts into Langfuse.
6. **Our own run traces are an optional MVP item, built only if time allows.**
   - The planned design: `run_steps` + **`run_spans`**, one table:
     - `kind`: `llm` · `tool` · `retrieval` · `http`;
     - links and timing: parent, `started_at`, `ended_at`, `status`;
     - LLM fields: tokens, cost, `prompt_version_id`;
     - JSONB `input` / `output`, with payloads kept 30 days.
   - It powers the whole Traces page.
   - **When it ships, Langfuse is removed as a dependency.**
7. **To keep that move cheap,** every LLM call goes through `LlmGateway`, which already reports each model round (tokens, tool calls, tool results), and tool `execute` functions are wrapped for timing. Only storage and UI remain to build.

## Consequences
- No trace UI to build for the MVP. Traces are good enough for the team, the demo and the coursework.
- **Known gaps until our own traces ship:**
  - customers can't see LLM-level traces;
  - deleting a workspace doesn't delete its traces in Langfuse (30-day history on the cloud tier limits this);
  - customer conversations are sent to a third party, which is acceptable for the demo but needs consent or self-hosting for real customers.
- The free tier's 2-user limit doesn't cover a team of 3, so share an account or upgrade.
- Evaluations (LLM-as-judge, datasets, code-driven experiments) are available in Langfuse while we use it.

## Alternatives considered
- **Our own Traces page from the start:** safe for tenants and better product value, but 3–4 weeks of extra work; kept as an optional item.
- **Self-hosted Langfuse on the homeserver now:** no third party, but ~2.4 GB of RAM that the server doesn't have yet.
- **Prompts stored in Langfuse:** Langfuse would become required to run bots, it doesn't fit the library's features, and the free tier's API limits are too low.
