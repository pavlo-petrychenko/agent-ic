# Communication: who talks to whom

**Status:** draft, Oct 2026. Companion to [architecture.md](architecture.md).

**Diagrams** (ExcaliDash, collection `agent-ic`):
- "4. Communication map": every connection between components.
- "5. Sequence — customer message to reply": chain A step by step.

---

## 1. Ground rules

1. **Our processes never call each other over HTTP.**
   - `gateway`, `api`, `worker-runs` and `worker-ingest` meet only in **Postgres** (state) and **Redis** (queues, events).
   - There is no internal API, no service discovery and no service-to-service auth to maintain.
2. **Postgres is the source of truth.** Every state change is written there first; Redis only carries work and notifications about state.
3. **Work goes through queues; news goes through pub/sub.**
   - "Someone must do X, retry until done" → a **BullMQ job**.
   - "Something changed, whoever cares can react" → a **Redis pub/sub event**. These are fire-and-forget, and consumers refetch from Postgres if they miss one.
4. **Who accepts what from outside:**
   - `gateway` accepts **machines**: Telegram, businesses' systems, Google / ClickUp change notifications.
   - `api` accepts **humans through the web app**: GraphQL, WebSocket, OAuth callbacks.
   - Workers accept **nothing** from outside; they expose only `/metrics` and `/health`.
5. **Sync calls to the outside happen only where someone is waiting:**
   - `api` calls out while a user waits, e.g. validating a bot token;
   - `gateway` never calls out;
   - workers do all the slow outbound work.

---

## 2. Connection matrix

**→ = calls / writes to. S = synchronous request/response, A = asynchronous (queue or pub/sub).**

| From | To | Mode | What for |
|---|---|---|---|
| Browser | `api` | S | GraphQL queries and mutations over HTTP |
| Browser | `api` | A | GraphQL subscriptions over WebSocket (Inbox, simulator, KB progress) |
| Browser | S3 / MinIO | S | Upload KB files directly with a presigned URL (up to 20 MB, never streamed through `api`) |
| Browser | Langfuse UI | S | "Open in Langfuse" links for platform admins only, when Langfuse is on (D47) |
| Telegram | `gateway` | S | Bot webhooks (customer messages) |
| Business systems | `gateway` | S | `POST /v1/channels/{id}/messages`, `/events`, KB refresh endpoint |
| Google / ClickUp | `gateway` | S | Change notifications for real-time KB sync |
| `gateway` | Postgres | S | Save message + conversation + run in one transaction; de-duplicate; check channel key hash |
| `gateway` | Redis queue | A | Enqueue `runs-reactive`, `ingest` (KB webhooks / refresh) |
| `gateway` | Redis pub/sub | A | Publish "new customer message"; subscribe to `run:{id}:done` for "wait for result" |
| `gateway` | Redis cache | S | Channel config lookup, per-channel rate limits |
| `api` | Postgres | S | Everything the dashboard reads and writes |
| `api` | Redis queue | A | Enqueue simulator runs, ingest jobs, operator messages (outbound), notification emails; manage cron schedulers on publish |
| `api` | Redis pub/sub | A | Publish operator actions; subscribe to forward events to its WebSocket clients |
| `api` | Redis cache | S | Sessions, permission cache, rate limits on auth |
| `api` | Telegram Bot API | S | `getMe` + `setWebhook` / `deleteWebhook` when connecting or disconnecting a bot |
| `api` | LLM / embedding providers | S | BYOK key check on save; embedding the query in the retrieval playground |
| `api` | Google / ClickUp OAuth | S | Exchange the OAuth code on callback |
| Redis queue | `worker-runs` | A | `runs-reactive`, `runs-proactive`, `outbound`, `notify`, `timers` |
| Redis queue | `worker-ingest` | A | `ingest` |
| `worker-runs` | Postgres | S | Load the flow version, prompts and history; save run steps, messages, escalations; vector search |
| `worker-runs` | Redis queue | A | Enqueue follow-ups: outbound, notify, the next run, timers |
| `worker-runs` | Redis pub/sub | A | Step events (simulator), message events (Inbox), `run:{id}:done` (gateway) |
| `worker-runs` | LLM providers | S | Agent and Completion steps |
| `worker-runs` | Telegram Bot API | S | `sendChatAction` (typing), `sendMessage` |
| `worker-runs` | Business systems | S | API-channel webhooks (signed); API request steps |
| `worker-runs` | Email provider, alerts bot | S | Operator alerts, system emails |
| `worker-runs` | Langfuse | A | Traces via the OTel Collector, only when Langfuse is on (D47) |
| `worker-ingest` | S3 / MinIO | S | Read uploaded files |
| `worker-ingest` | Google / ClickUp APIs | S | Fetch documents |
| `worker-ingest` | Embedding provider | S | Embed chunks |
| `worker-ingest` | Postgres | S | Write chunks and swap them in one transaction; source status |
| `worker-ingest` | Redis pub/sub | A | Indexing progress events |
| Prometheus | every process | S | Scrape `/metrics` (pull) |

**Connections that must never exist:**
- browser → `gateway`, workers, Postgres or Redis;
- `api` ↔ `gateway` over HTTP;
- anything → workers over HTTP;
- workers → browser.

---

## 3. Chains

Notation: `→` sync call, `⇢` async (queue job or pub/sub event).

### A. Customer message in Telegram → agent reply
*(diagram "5. Sequence — customer message to reply")*

1. Telegram → `gateway`: webhook update (checked with `secret_token`).
2. `gateway` → Postgres, in one transaction:
   - insert the message (unique `update_id`, so duplicates are dropped);
   - upsert the conversation;
   - if the agent should answer and no run is active: insert a run, set `active_run_id`.
3. `gateway` ⇢ queue `runs-reactive`.
4. `gateway` ⇢ pub/sub `conv:{id}:messages`.
5. `gateway` → Telegram: `200 OK` in under 100 ms.
6. Every `api` pod ⇢ its WebSocket clients watching that conversation or Inbox: "new message".
7. `worker-runs` ⇢ takes the job, then → Postgres: loads the run, the flow version, prompts and the last N messages.
8. `worker-runs` runs the steps:
   - Parallel: guard + observer → LLM;
   - Router;
   - Agent → LLM, with the KB-search tool → Postgres (pgvector) → `messages[]`.

   Each step's result → Postgres (`run_steps`), traced ⇢ Langfuse (when it is on).
9. Send message step → Postgres: outbound messages with idempotency keys, then ⇢ queue `outbound`.
10. `worker-runs` (outbound consumer) → Telegram: typing, then `sendMessage` for each item, rate-limited per bot. → Postgres: marked as sent.
11. The run finishes → Postgres: clear `active_run_id`. Messages arrived meanwhile? → start the next run (back to step 3).
12. `worker-runs` ⇢ pub/sub: messages + `run:{id}:done` → `api` pods ⇢ browsers: "agent replied".

**Variations:**
- **The conversation is `waiting` or `handled_by` an operator:** only steps 1, 2, 4, 5 and 6. The message goes to the Inbox and no run starts.
- **A run is already active:** step 3 is skipped; step 11 picks the message up. This gives ordering and merges quick messages into one run.
- **The agent is paused:** depending on its setting, the message goes to the Inbox or an away message is sent through `outbound`.
- **A step fails:** BullMQ retries the job, and already finished steps are skipped thanks to `run_steps`. After the last retry, the fallback runs (escalate). The run is marked failed → metrics + "Needs attention".

### B. API channel, "reply in the response"
1. Business system → `gateway`: `POST /v1/channels/{id}/messages` with `Bearer <secret>` → Postgres (compare the key hash, save message + run).
2. `gateway` **subscribes** to pub/sub `run:{runId}:done` **first**, then ⇢ enqueues the run, so it can't miss a fast result.
3. Chain A steps 7–9 run, but the Send-message step for an API channel in this mode **doesn't use `outbound`**. The messages go into the `run:{id}:done` event.
4. `gateway` gets the event → responds `{ conversation_id, messages[], status: answered | escalated }`.
5. No result within 30 s → respond `status: pending`. The rest is delivered to the channel's webhook (chain C).

### C. API channel, "reply to my webhook"
1. As B.1, then ⇢ enqueue the run → `202 Accepted` immediately.
2. Chain A steps 7–9 run. `outbound` jobs → the business webhook (`POST`, HMAC-signed), retried with backoff.
3. Operator replies and follow-ups for API conversations always arrive this way.

### D. External event trigger
1. Business system → `gateway`: `POST /v1/channels/{id}/events` `{ event, user_id, …payload }` → Postgres: find or create the conversation by `user_id`, save the event and the run.
2. Then as B ("wait for result") or C ("don't wait"). The run starts at the matching External event trigger, with `event.*` variables.

### E. Schedule trigger (follow-ups, digests)
1. Publish (chain I) → `api` creates or updates a **BullMQ job scheduler** per Schedule trigger (cron + time zone) in Redis.
2. On each tick, Redis queue ⇢ `worker-runs` (`timers`): query Postgres for conversations that match the conditions (e.g. silent > 24 h, not escalated), limited to N.
3. For each one: Postgres (create the run, once per conversation) ⇢ queue `runs-proactive`. A per-workspace concurrency cap protects live chats.
4. Each run is then chain A steps 7–12. Delivery for Telegram is allowed only if the user wrote to the bot before.

### F. Escalation → operator → hand back
1. Escalation step in `worker-runs` → Postgres, in one transaction:
   - conversation `waiting`;
   - an escalation row (reason, guard output);
   - an outbox row "notify".
2. ⇢ queue `outbound`: the message to the customer ("a person will reply soon").
3. ⇢ queue `notify`: alerts per recipient's settings → email provider / alerts bot. In-platform alerts → Postgres (notification) ⇢ pub/sub `ws:{id}:inbox` → browsers: "Needs you" badge.
4. ⇢ queue `timers`: **delayed** jobs — a reminder in 5 min and a fallback in 30 min.
5. Operator clicks **Take over**: browser → `api` mutation → Postgres conditional update (`waiting → handled_by me`; the update fails if someone else was faster) → cancel the delayed jobs ⇢ pub/sub → other operators see "taken by X".
6. Operator **replies**: browser → `api` mutation → Postgres (message, author = operator) ⇢ queue `outbound` → `worker-runs` → Telegram or the business webhook. This is the same delivery path as the agent's messages, with the same rate limits and retries.
7. Customer messages while the operator handles the chat: chain A, variation "handled_by", so they appear in the Inbox only.
8. **Hand back:** browser → `api` mutation → Postgres (`agent_active`) ⇢ pub/sub. The next customer message starts a run (chain A).
9. **Close:** browser → `api` → Postgres (`closed`, optional closing message ⇢ `outbound`). The next customer message starts a new conversation.

### G. Simulator (testing the draft)
1. Browser → `api` mutation `simulateMessage(agentId, text)` → Postgres: test conversation + run pinned to the **draft** version, flagged `simulated`.
2. `api` ⇢ queue `runs-reactive` (the builder is waiting, so it gets the same priority).
3. Browser is already subscribed to `run:{id}:steps` through `api`.
4. `worker-runs` runs the flow with the **simulated channel adapter**:
   - no real delivery and no notifications;
   - after each step ⇢ pub/sub `run:{id}:steps` → `api` → browser shows the live trace;
   - "messages sent" go into the event, not to Telegram.
5. "Reply as operator" and "fire event / schedule now" are `api` mutations that enqueue the same jobs with the simulated adapter.

### H. Knowledge base: file upload
1. Browser → `api` mutation `createUpload(kbId, filename, size)` → `api` checks permissions and limits → returns a **presigned PUT URL** (signed locally; no call to S3).
2. Browser → S3 / MinIO: PUT the file directly.
3. Browser → `api` mutation `confirmUpload` → Postgres: source row `pending` ⇢ queue `ingest`.
4. `worker-ingest`:
   - → S3 read → parse → chunk;
   - → embedding provider;
   - → Postgres: new chunks, then **swap them in one transaction**;
   - progress ⇢ pub/sub `ws:{id}:knowledge` → browser.
5. A parse error → source status `error` + reason ⇢ pub/sub.

### I. Knowledge base: Google Docs / ClickUp
1. **Connect:** browser → `api` starts OAuth → redirect to Google → Google redirects the browser to the **`api` callback** → `api` → Google token endpoint (exchange the code) → Postgres (encrypted tokens).
2. **Sync triggers**, all of which end in ⇢ queue `ingest`:
   - one-time: right after connecting;
   - scheduled: a BullMQ job scheduler;
   - manual: browser → `api` mutation, or business system → `gateway` refresh endpoint;
   - real-time: Google / ClickUp → `gateway` change notification.
3. `worker-ingest` → Google / ClickUp APIs (fetch), then like H.4. "Access revoked" → status `error` ⇢ pub/sub, plus ⇢ `notify` (email to owners).

### J. Publish a version
1. Browser → `api` mutation `publish(agentId, note)` → validation with `@agent-ic/flow` → Postgres, in one transaction:
   - a new immutable version;
   - `live_version_id` switches.
2. `api` → Redis: reconcile Schedule triggers (create / update / remove job schedulers).
3. `api` ⇢ pub/sub `ws:{id}:agents` → browsers update the status.
4. Runs already in progress keep their `version_id`. New runs pick up the new live version.

### K. Connecting a Telegram channel
*Production always uses webhooks. Local dev may use a polling transport with test bots; both call the same `handleTelegramUpdate()` (ADR 0008).*

1. Browser → `api` mutation `connectTelegram(token, agentId)` → Telegram `getMe` (validate) → Telegram `setWebhook(url, secret_token)`. Both are synchronous; the user sees errors immediately.
2. → Postgres: channel with the encrypted token.
3. **Broken token later:** `worker-runs` sends fail with 401, or Telegram stops delivering → channel status `broken` → Postgres ⇢ `notify` (email to owners and admins) ⇢ pub/sub (UI badge).

### L. Accounts and system emails
- Sign-up, password reset, invites, usage at 80% / 100%: `api` → Postgres (token / state) ⇢ queue `notify` → `worker-runs` → email provider.
- `api` never sends email inline, so a slow email provider can't slow a sign-up request.

### M. Observability (all processes)
- Prometheus → `/metrics` on every pod (pull), plus exporters for Postgres, Redis and PgBouncer.
- Logs: stdout → the cluster log agent → Loki.
- LLM traces: `worker-runs` (and `api` for the playground) → OTel Collector ⇢ Langfuse, when it is on; the run stores the trace ID.
