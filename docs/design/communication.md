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
   - `gateway` accepts **machines**: Telegram and businesses' systems.
   - `api` accepts **humans through the web app**: GraphQL, WebSocket, OAuth token exchange.
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
| Browser | S3 / Silo | S | Upload KB files directly with a presigned URL (up to 20 MB, never streamed through `api`) |
| Browser | Langfuse UI | S | "Open in Langfuse" links for platform admins only, when Langfuse is on (D47) |
| Telegram | `gateway` | S | Bot webhooks (customer messages) |
| Business systems | `gateway` | S | `POST /v1/channels/{id}/messages`, `/events` |
| `gateway` | Postgres | S | Save message + conversation + run in one transaction; de-duplicate; check channel key hash |
| `gateway` | Redis queue | A | Enqueue `runs-reactive` |
| `gateway` | Redis pub/sub | A | Publish "new customer message"; subscribe to `run:{id}:done` for "wait for result" |
| `gateway` | Redis cache | S | Channel config lookup, per-channel rate limits |
| `api` | Postgres | S | Everything the dashboard reads and writes |
| `api` | Redis queue | A | Enqueue simulator runs, ingest jobs, operator messages (outbound), notification emails |
| `api` | Redis pub/sub | A | Publish operator actions; subscribe to forward events to its WebSocket clients |
| `api` | Redis cache | S | Sessions, permission cache, rate limits on auth |
| `api` | Telegram Bot API | S | `getMe` + `setWebhook` / `deleteWebhook` when connecting or disconnecting a bot |
| `gateway` | Telegram Bot API | S | `getUpdates` long polling, local-dev transport only (ADR 0008) |
| `api` | LLM / embedding providers | S | BYOK key check on save; embedding the query in the retrieval playground |
| `api` | Google OAuth | S | Exchange the OAuth code on the connection callback |
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
| `worker-ingest` | S3 / Silo | S | Read uploaded files |
| `worker-ingest` | Google Drive API | S | Fetch picked documents |
| `worker-ingest` | Embedding provider | S | Embed chunks |
| `worker-ingest` | Postgres | S | Write sections, chunks, terms and vectors under a new generation; flip the document; source status |
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

1. Telegram → `gateway`: webhook update (checked with `secret_token`); in local dev the `gateway` pulls the same update with `getUpdates` (chain K).
2. `gateway` → Postgres, in one transaction:
   - record the update in `channels.channel_events` (unique `channel_id + update_id`, so a retry is dropped);
   - insert the message (unique `conversation_id + message_id`, so the same message is not stored twice);
   - upsert the conversation;
   - if the agent should answer and no run is active: insert a run, set `active_run_id`.
3. `gateway` ⇢ queue `runs-reactive`.
4. `gateway` ⇢ pub/sub `conv:{id}:messages`.
5. `gateway` → Telegram: `200 OK` in under 100 ms.
6. Every `api` pod ⇢ its WebSocket clients watching that conversation or Inbox: "new message".
7. `worker-runs` ⇢ takes the job, then → Postgres: loads the run, the flow version, prompts and the conversation's messages.
8. `worker-runs` runs the steps:
   - Parallel: a waited Completion and a background Completion → LLM;
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
*(ADR 0025, D291 to D293)*

1. Nothing happens on publish, pause or delete: the live Schedule triggers are a query, not Redis state.
2. A recurring job on `timers` runs every 30 seconds in `worker-runs`. It → Postgres: lists Schedule triggers of live versions whose agent is not paused or deleted (a generated column on `agent_versions`, read by an allow-listed system reader), and computes each trigger's latest due tick in its time zone. Ticks more than 10 minutes late are skipped and counted.
3. For every due tick: ⇢ queue `runs-proactive` (`fire-schedule-tick`, job id from agent, trigger and tick).
4. `worker-runs` takes the tick job, then → Postgres, in one transaction:
   - insert the tick row (unique per agent, trigger and tick; a retry or a second sweeper stops here);
   - re-check that the live version still has the trigger and that the agent is not paused;
   - if the workspace is over its usage limit and the flow uses a platform model, mark the tick `skipped_usage_limit` and stop;
   - select the candidate conversations: live, `agent_active`, no run in progress, customer has written, silent ≥ N hours, never escalated, in the chosen channel types, oldest silence first, up to the limit;
   - for each, insert the contact marker (unique per conversation and tick, and per conversation when "once per conversation" is on) and a run that starts at the Schedule trigger.
5. Each run ⇢ queue `runs-proactive` with its own trace, then is chain A steps 7–12. Delivery for Telegram is allowed only because the customer has written to the bot before.
6. Without "once per conversation" the marker is released when the customer writes, so a conversation is contacted once per silence.

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
1. Browser → `api` mutation `createUpload(kbId, filename, size)` → `api` checks permissions and limits → creates an upload ticket → returns a **presigned PUT URL** and the document id (signed locally; no call to S3).
2. Browser → S3 / Silo: PUT the file directly.
3. Browser → `api` mutation `confirmUpload` → `api` HEADs the object, copies it server-side to its permanent key, creates source and document rows as `pending` ⇢ queue `ingest` (durable).
4. `worker-ingest`:
   - → S3 read → parse → canonical Markdown → sections → chunks;
   - → whole-document summary on the first index (skipped on re-sync) and embedding provider; BM25 terms in the same transaction;
   - → Postgres: new sections, chunks, terms and vectors under generation N+1, then **flip `documents.active_generation` in one transaction**;
   - progress ⇢ pub/sub `knowledge-source-status` → browser.
5. A parse error → document status `error` with a reason; other documents continue ⇢ pub/sub.
6. A summary edit: browser → `api` mutation `updateDocumentSummary` → Postgres `summary` + `summary_source = user` ⇢ queue `ingest` (`reindex-knowledge-document`) → `worker-ingest` rebuilds `index_text`, embeddings and terms, then flips the generation. The old generation stays searchable until the flip.

### I. Knowledge base: Google Docs
1. **Connect:** browser → `api` mutation starts OAuth → redirect to Google → Google redirects the browser to the **web callback route** → browser → `api` mutation exchanges the code with Google → Postgres (sealed refresh token).
2. **Pick documents:** browser asks `api` for a short-lived Picker token → Google Picker → selected document ids → `api` mutation creates one source and one document per picked Google Doc.
3. **Sync triggers**, all of which end in ⇢ queue `ingest`:
   - initial: right after the source is created;
   - scheduled: a per-source BullMQ job scheduler;
   - manual: browser → `api` mutation.
4. `worker-ingest` → Google Drive API (metadata, then Markdown export for changed documents), then like H.4. A revoked token → connection `revoked`, source `error` ⇢ pub/sub, plus ⇢ `notify` (email to owners).

### J. Publish a version
1. Browser → `api` mutation `publish(agentId, note)` → validation with `@agent-ic/flow` → Postgres, in one transaction:
   - a new immutable version;
   - `live_version_id` switches.
2. `api` ⇢ pub/sub `ws:{id}:agents` → browsers update the status.
3. Runs already in progress keep their `version_id`. New runs pick up the new live version.

### K. Telegram channel lifecycle
*Production uses webhooks; local dev can use long polling (`TELEGRAM_TRANSPORT=polling`). Both transports feed the same entry point — `handleTelegramUpdate` in `TelegramUpdatesService`: de-duplicate in `channels.channel_events` by `(channel_id, update_id)`, map the update to a message, save it and enqueue the run (ADR 0008).*

1. Browser → `api` mutation `connectTelegram(token, agentId)` → Telegram `getMe` (validate) → `setWebhook(url, secret_token)` in webhook mode, `deleteWebhook` in polling mode. Both are synchronous; the user sees errors immediately.
2. → Postgres: channel with the sealed token and the bot identity; `pending` while the transport is configured, then `connected`.
3. **Polling transport (local dev):** the `gateway` role runs `TelegramPollerService` only when `TELEGRAM_TRANSPORT=polling`. It lists connected Telegram channels across workspaces, calls `getUpdates` per bot with that channel's offset and `TELEGRAM_POLL_TIMEOUT_SECONDS`, and passes each update to the entry point. The offset advances only after the update is handled; it is kept in memory, and `channel_events` makes a replay after a restart harmless. One consumer per bot: a second poller or a registered webhook gets `409`.
4. **Settings, replace, disconnect, reconnect, refresh:** `updateTelegram(id, agentId, showTyping)` stores who answers; `replaceTelegramToken(id, token)` validates the new token, requires the same bot, re-registers the transport and seals the new token; `disconnectTelegram(id)` deletes the webhook and sets `disconnected`; `reconnectTelegram(id)` reuses the sealed token, validates the same bot, generates a new webhook secret, re-registers the transport and returns `connected`, without asking for the token again. Reconnect claims `disconnected → pending` first, so two clicks cannot create conflicting secrets. `refreshTelegramIdentity(id)` calls `getMe` and updates only the stored bot username and first name, leaving status, webhook and credentials untouched.
5. **Delete:** `deleteChannel(id)` removes the webhook (unless the channel is already disconnected), then deletes the row; `channel_events` cascade, while conversations, messages and runs stay. The bot id is freed, so the same bot can be connected again.
6. **Outbound:** `worker-runs` delivers through `TelegramChannelAdapter`: it loads the channel and opens its token, enforces the per-bot and per-chat token buckets, sends `sendChatAction` when `showTyping` is on, then `sendMessage` to the conversation's chat id. The delivery use case marks the message `delivered` or `failed`.
7. **Broken token later:** sends fail with 401, or Telegram stops delivering → status `broken` → email to owners and admins (not built yet).

The webhook endpoint is `POST /webhooks/telegram/{workspacePublicId}/{channelPublicId}`: the gateway checks the `x-telegram-bot-api-secret-token` header against the channel's sealed webhook secret hash, then calls `handleTelegramUpdate`. Local development can keep using the polling transport; the two are mutually exclusive per bot (ADR 0008).

### L. Accounts and system emails
- Sign-up, password reset, invites, usage at 80% / 100%: `api` → Postgres (token / state) ⇢ queue `notify` → `worker-runs` → email provider.
- `api` never sends email inline, so a slow email provider can't slow a sign-up request.

### M. Observability (all processes)
- Prometheus → `/metrics` on every pod (pull), plus exporters for Postgres, Redis and PgBouncer.
- Logs: stdout → the cluster log agent → Loki.
- LLM traces: `worker-runs` (and `api` for the playground) → OTel Collector ⇢ Langfuse, when it is on; the run stores the trace ID.
