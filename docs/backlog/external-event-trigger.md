# External event trigger

## Now
- The flow package has the trigger: `trigger-external-event.schema.ts` (`eventName`, `channelId`, `examplePayload`, `replyMode`), its validation and the `event.*` variables. The builder hides it (D246, D248).
- The backend has no runtime for it. A run starts only from a customer message, and `runs.trigger` allows only `message` (D220, D221).
- The API channel it needs does not exist: no key table, no `/v1` routes, no key authentication, and the web API channel page shows mocks.
- The design is ready: `MVP-FB-Trigger-Event`, `MVP-Testing-Event`, `MVP-Channels-API*`.

## When the API channel lands
1. API channel: keys shown once and stored hashed, rotation with a 24 h overlap, request authentication, rate limits, the web page on real data.
2. A `conversation_events` table with an idempotency key per channel. A conversation is found by agent, channel, mode and `user_id`; a closed one opens a new one; a waiting or handled one stores the event and starts no run.
3. Runs started from an event: `run_trigger = event`, the walk starts at the trigger node, `event.*` variables, and LLM steps see the event as a context line.
4. `POST /v1/channels/{id}/events`: 202 Accepted, or "wait for result" up to 30 s with the flow's messages; messages after the deadline go to the webhook.
5. Webhook delivery signed with HMAC, `POST /v1/channels/{id}/messages`, an OpenAPI document and a developer guide.
6. Publish checks: the trigger's channel exists, is an API channel and belongs to this agent; a webhook is required when the flow can escalate or message later.
7. Builder inspector for the trigger and "fire event" in the simulator.
8. A conversation is keyed by `channel_id` too, so two channels on one agent do not share a conversation for the same user.

The full PR breakdown and the open decisions are in the plan from 2026-10-29 (15 PRs, 13 decisions).

## Depends on
- The API channel in the channels area, built by the channels owner.
- Runs started by a trigger other than a message, which the schedule and inactivity triggers add first.
