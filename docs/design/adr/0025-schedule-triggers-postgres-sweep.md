# 0025. Schedule triggers fire from a Postgres sweep

- **Status:** Accepted
- **Date:** 2026-10-29
- **Replaces:** the "BullMQ job scheduler per Schedule trigger" design in chain E of [communication.md](../communication.md). ADR 0015 (jobs after commit, durable outbox) still stands.

## Context

The Schedule trigger node and its config already exist in `@agent-ic/flow`: daily, weekdays or custom cron, a time zone, "silent for N hours", "not escalated", channel types, a maximum number of conversations per run and "once per conversation". The builder hides the node and nothing runs it.

The first design (chain E) created one BullMQ job scheduler per trigger on publish and removed it on pause, delete or unpublish. That has four problems:

- **State to keep in sync.** A scheduler lives in Redis and its source of truth is a flow version in Postgres. Publish, rollback, agent pause, agent delete and workspace delete all have to reconcile it, and a missed reconcile means a trigger that fires forever or never.
- **Redis is not the source of truth** (rule 2 of the ground rules). A lost Redis loses every schedule until the next publish.
- **A tick is not a run.** A tick has to pick many conversations. The picking, the "contact once" markers and the usage check all live in Postgres anyway.
- **No place for idempotency.** A scheduler job that is retried after a crash would contact the same customers twice unless Postgres says it already ran.

The same release adds the inactivity timer ([mvp-scope](../mvp-scope.md), D294), which also needs a Postgres-backed clock. Both triggers start runs without a customer message, which is a base change of its own (D290).

## Decision

### Firing

- A recurring job (`@ScheduleJob`, every 30 seconds) on the `timers` queue sweeps Postgres for due triggers. A trigger is due when its next tick is not later than now and the agent has a **live** version that holds the node. Paused and deleted agents are not listed, so there is nothing to clean up on publish, pause or delete.
- Live Schedule nodes are read from a generated column on `agents.agent_versions` (a `jsonb_path_query_array` over the flow) through an allow-listed system reader, because the sweep crosses workspaces.
- The sweep only decides which ticks are due; for each it enqueues one `fire-schedule-tick` job on `runs-proactive`. That job re-checks the live version, the pause state and the usage limit before it picks conversations, because time has passed since the sweep.
- A tick is up to 30 seconds late. That lag is exported as a metric.

### Time

- Cron runs on wall-clock time in the trigger's IANA time zone. The cron library is `croner`: no dependencies, time zones through `Intl`, small in the web bundle, and the same helpers run in the builder to show the next three runs. If it fails the daylight-saving tests, `cron-parser` replaces it behind the same helper functions.
- A time that does not exist (spring-forward gap) fires at the first valid minute after the gap. A time that exists twice (fall-back) fires once, on its first occurrence.
- The identity of a tick is its UTC instant.

### Missed ticks

- After downtime only the **latest** due tick fires, and only when it is at most 10 minutes late and not older than the version's publication. Older ticks are skipped and counted, so customers are not messaged at odd hours after an outage.

### Idempotency

- `runs.schedule_ticks` holds one row per `(agent, trigger node, tick)` with a unique key and an outcome (`fired`, `skipped_paused`, `skipped_changed`, `skipped_usage_limit`). Inserting the row is how a tick is claimed; a retry or a second sweeper finds it and stops.
- `conversations.schedule_contacts` holds one contact marker per `(conversation, agent, node, tick)`, plus a partial unique key per conversation when the node says "once per conversation". A retried tick job skips conversations it already contacted.
- The BullMQ job id of a tick is derived from agent, node and tick, and has no colons.

### Who gets the message

- Candidates are live conversations that are `agent_active`, have no run in progress, where the customer has written at least once, silent for at least N hours, **never escalated**, in the chosen channel types, oldest silence first, up to the node's limit.
- "Not escalated" means the conversation has never been escalated (`last_escalated_at` is null). One shared helper in `conversations` defines it for this trigger and for the inactivity timer.
- Without "once per conversation" a conversation is contacted **once per silence**: the marker is released when the customer writes. Otherwise "silent for more than 24 hours" would message the customer every day.
- Telegram bots may only write to people who wrote first, which "the customer has written at least once" already guarantees. Users who blocked the bot are excluded.
- A candidate index on `(workspace_id, agent_id, last_customer_message_at)` for live, `agent_active` rows keeps the query cheap.

### Limits

- The platform caps a run at 200 conversations and a trigger at 4 ticks per hour. The flow validation reports both, so the limits are blocking publish issues and not silent truncation.
- An empty channel-type list is a blocking issue. The builder's template ticks every channel.
- There is no per-workspace concurrency cap on `runs-proactive` yet. The separate queue and the per-run cap protect live chats; a cap is added if the lag metric shows a need.
- When the workspace is over its usage limit and the flow uses a platform model, the whole tick is skipped with `skipped_usage_limit`. Schedule runs do not count as new conversations.

### Runs

- Each contacted conversation gets its own run, started by the trigger node, covering the conversation's latest customer message. The run and its trace are detached from the tick: its own Langfuse trace, in the conversation's session, tagged with the trigger. The tick has its own trace that links to them.
- Auto-close (D289) and this trigger interact only through a validation warning when auto-close would fire before the silence is reached. A closed conversation is never reopened.

### Simulator

- **Run schedule now** works on the draft. It needs one customer message in the test chat first. It shows every condition as a check and runs anyway, so a builder can test the follow-up text without waiting for a real silence.

## Consequences

- Publish, rollback, pause and delete have no scheduling side effects. The set of schedules is a query.
- Every wall-clock behaviour (time zones, daylight saving, missed ticks) is in pure helpers with tests in `@agent-ic/flow`.
- Two small tables (`schedule_ticks`, `schedule_contacts`) and one generated column are added; all migrations are expand-only.
- Triggers fire up to 30 seconds late, which is fine for follow-ups and digests but means the trigger is not a precise timer.
- The `timers` worker holds one more recurring job. Its health is visible through `schedule_ticks_total`, `schedule_tick_lag_seconds`, `schedule_ticks_missed_total` and `schedule_matches_total`, and alerts live in the deploy repo.
- Chain E in `communication.md` is rewritten; the Publish chain no longer reconciles schedulers.

## Alternatives considered

- **One BullMQ job scheduler per trigger (the old chain E).** Rejected for the four reasons in Context: reconciling Redis with versions on every publish, pause and delete; Redis as the only place a schedule exists; no idempotency; and the picking of conversations is Postgres work anyway.
- **A BullMQ delayed job per next tick, re-added after each run.** The same reconcile problem, and a delayed durable job in the outbox would fire at once.
- **Catching up every missed tick after downtime.** Rejected: customers would be messaged in a burst at odd hours. Skipping and counting is safer for follow-ups.
- **A per-workspace concurrency cap now.** Deferred: the per-run cap and the separate queue are enough until the lag metric says otherwise.
