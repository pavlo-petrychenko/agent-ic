# 018 How a run works

[Back to the docs](../README.md)

A run is one walk of an agent's flow for a conversation. A customer writes, the worker walks the flow of a pinned agent version step by step, and whatever the flow sends goes back through the channel. This page follows one message from the channel to the reply.

## What it is

- The `runs` module ([modules/runs](../../apps/backend/src/modules/runs/)) is the flow engine. It owns two tables: `runs.runs`, one row per run, and `runs.run_steps`, one row per step a run took (D221, D222).
- A run is pinned to an agent version id and carries the conversation `mode`, `live` or `simulation`. Its `status` is `queued`, `running`, `succeeded`, `failed` or `escalated`, and it remembers the last customer message it covers (D220).
- A step is keyed by run, node and branch. It keeps its input, its output, the port it took, its failure and its attempt number.
- Each node type has one step executor: message trigger, Router, Parallel, Completion, Agent, API request, Send message and Escalation. They are listed under the `STEP_EXECUTORS` token and found by `StepExecutorRegistry`.

## Why it works this way

- **Jobs retry.** A worker can die mid-run, and a model can be down. Every finished step is saved, so a retried job skips it, and every message a step sends has a stable key, so a retry never sends it twice.
- **One run per conversation at a time.** Customers send several short messages in a row. The conversation is claimed by one run, and the messages that come during it are answered together by one follow-up run.
- **A run never reads "the live version".** It gets a version id from its caller, so a publish in the middle of a run changes nothing, and the simulator runs a frozen copy of the draft with the same engine.
- **Chat history is never cut.** Every step that needs it gets the whole conversation from `ConversationHistoryService.forRun`, the one place where compaction could go later.

## How it works

```
channel adapter -> IncomingMessagesService.handleIncomingMessage      (conversations)
  paused, Inbox         -> conversation waiting, needs-operator, no run
  paused, away message  -> the away text, once per pause, no run
  waiting or handled    -> stored only
  otherwise             -> message-received (durable event)
runs.start-on-message listener -> RunLifecycleService.startRun          (runs)
  claim the conversation, insert the run queued, enqueue runs.execute (job id = run id)
runs.execute processor -> ExecuteRunUseCase
  RunExecutionService.execute: walk the pinned flow, one short transaction per step
  end: release the claim, start one follow-up run for messages that came meanwhile
Send message / Escalation -> ConversationRunsService.recordOutbound -> outbound-queued
deliver-outbound-message listener -> ChannelAdapter.send                (channels)
```

1. **A message arrives.** A channel adapter calls `handleIncomingMessage`. It drops a repeated external id, opens a conversation (a new one after `closed`) and saves the message. A paused live agent never starts a run: Inbox mode moves the chat to `waiting`, away-message mode queues the away text once per pause. Otherwise it emits `conversations.message-received`, durable, with the conversation, the message, the agent, the mode and, for the simulator, the version id.
2. **A run starts.** The listener pins the run to the event's version id, or to the agent's live version when there is none (a paused, unpublished or deleted agent starts nothing). `startRun` claims the conversation by setting its `active_run_id`. When another run holds it, nothing starts: that run picks the message up when it ends. The new run covers every customer message after the conversation's latest run, so three quick messages give one run (D224).
3. **The run walks the flow.** `RunExecutionService` loads the run, the pinned version, the conversation and its whole history in one short transaction. Then, from the message trigger, for each step: start the step row, call the executor outside any transaction, finish the row with its output and port, and publish the step on the live-update channel `run-steps:<runId>`. A step sees the trigger's variables (`message.text` joins the customer messages the run covers, `user.name`, `channel` and more), `today`, and the output of every earlier step `createScopeLookup` shows, under the step's key (D223).
4. **Ports pick the next step.** A Router takes the port of the first rule that matches, else `else`. A Parallel runs its branches at once with their own branch keys, waits for the waited branches as `waitFor` says and lets the background ones run on (D225, D264; see [Parallel branches](#parallel-branches)). A Completion feeds the steps after it, such as a Router, unless it sits in a background branch, whose outputs are hidden after the join (D226, D264). An Agent step answers with `messages` and never writes to the customer itself (D227).
5. **Only two steps talk to the customer.** Send message and Escalation record each message through `recordOutbound` with the key `run:<run>:node:<node>:<index>`, which queues `outbound-queued` after the commit; the channels module delivers it. Escalation in `escalate` mode moves the conversation to `waiting` and ends the run `escalated`; in `end` mode it closes the conversation (D251).
6. **The run ends.** In one transaction the run is finished and the claim released. When this run held the claim and customer messages came during it, one follow-up run starts for all of them, on the same version for a simulation and on the live version for a live chat (D224).

## Failures and retries

- **A step fails** (a wrong answer, an API error with `error_port`, a non-retryable 4xx): the walk follows the node's `error` port when it is connected, and otherwise ends the run `failed` with the step's `RunFailure`.
- **A step throws an error jobs retry**, such as `LlmUnavailableError` when the model and its fallback are both down: the job fails and BullMQ retries it with backoff. The retry skips every finished step, runs the step left `running` again as attempt 2, and sends nothing twice.
- **The run cannot load** (a missing version or conversation): the run ends `failed` and the claim is released, so the next message can start a run.
- Known gap: a job that uses up all its retries leaves the run `running` and the conversation claimed (D224).
- **A step in a background branch fails with no `error` path:** only that branch stops. The failure stays on the step, and the run goes on and ends as if the branch had finished (D264).

## Parallel branches

A Parallel step forks the flow into 2 to 5 branches that walk at once. Each `branches` edge says whether the reply waits for its branch (D264).

| | Reply waits (default) | In background |
| --- | --- | --- |
| The join waits for it | yes, for all of them or the first (`waitFor`) | no |
| Its outputs after the join | visible | not visible |
| A step fails with no `error` path | the run fails | the branch stops, the run goes on |
| Escalation | allowed: it ends the run and the other branches stop before their next step (D251) | not allowed |
| Send message | not allowed | not allowed |
| Several steps | yes | yes |

At least one branch must be waited, or the flow does not validate (`NO_WAITED_BRANCH`). The run ends only after its background branches finish, so no work outlives the job.

Three patterns cover most uses:

- **A guard and an agent together.** A Completion that checks the message (is it a complaint?) and an Agent that drafts the reply both run in waited branches. After the join a Router reads the check and either escalates or goes on to Send message. The customer waits for the slower of the two, not for the sum.
- **Fetch in parallel.** Two API requests (bookings and loyalty) run in waited branches, and the Agent after the join uses both outputs. This takes the time of the slowest request.
- **Background work.** A Completion scores the conversation and an API request posts the score, in a background branch, while the waited branch answers the customer. The reply does not wait for the scorer, and its outputs are not visible after the join. If the scorer fails, the failure is on its step and the customer still gets the reply.

Flows saved before background branches had a Completion `role` (guard or observer). They are read as background branches where an observer started a branch, and the next draft save stores the new format (D264).

## Simulation

The simulator freezes the draft with `AgentRuntimeReader.snapshotDraft`, which writes an immutable `snapshot` version, and sends the message with `mode: simulation` and that version id. The run is pinned to the snapshot like a live run to its version. A simulation ignores the pause, uses the simulated channel only, and its events carry the mode, so notifications and timers skip it.

## Tracing

One run attempt is one Langfuse trace: the trace id is saved on the run, the conversation is the session, each step is a span named by its node key, and the LLM calls of a step are generations under it. A retried job starts a new trace and the run points at the latest one (D228).

## In the code

- [incoming-messages.service.ts](../../apps/backend/src/modules/conversations/services/incoming-messages.service.ts): the entry point for every channel, and the pause rules.
- [start-run-on-message.listener.ts](../../apps/backend/src/modules/runs/listeners/start-run-on-message.listener.ts) and [run-lifecycle.service.ts](../../apps/backend/src/modules/runs/services/run-lifecycle.service.ts): claiming, starting, ending and follow-up runs.
- [run-execution.service.ts](../../apps/backend/src/modules/runs/services/run-execution.service.ts): the step loop, branches, error ports and tracing.
- [services/](../../apps/backend/src/modules/runs/services/): one `*-executor.service.ts` per node type.
- [run-messages.service.ts](../../apps/backend/src/modules/runs/services/run-messages.service.ts): how Send message and Escalation record what they send.
- [deliver-outbound-message.use-case.ts](../../apps/backend/src/modules/channels/use-cases/deliver-outbound-message.use-case.ts): the delivery through the channel adapter.
- Spec: [runs-end-to-end.spec.ts](../../apps/backend/test/integration/runs-end-to-end.spec.ts) boots a worker with real queues and the mock LLM, and covers an answer through the simulated channel, an escalation, both pause modes, a retried job, merged messages and a simulation on a snapshot.

## Add a step type

- [ ] The node's config and ports live in `packages/flow`; add them there first.
- [ ] Write a `StepExecutor` in `modules/runs/services/`, returning `{ port, output }`. Throw a `DomainError` to fail the step, or let an `Unavailable` error through so the job retries.
- [ ] Make it safe to run twice: anything it writes or sends needs a stable key.
- [ ] List it in `runs.module.ts`, both as a provider and in the `STEP_EXECUTORS` factory.
- [ ] Never read history yourself with a limit: use `scope.history`.

## Pitfalls

- Never send to the customer from an executor other than Send message and Escalation.
- Never hold a transaction open around an executor call: a model call can take 30 seconds (D39).
- A step's saved `input` leaves out `history`, so do not look for the conversation in `run_steps`.
- A run in `simulation` mode must never notify anyone or use a real channel. Carry the mode on every event you add.

Next: look at real code in the examples, starting with [the identity module](../examples/identity-module.md). The list is in [the examples section](../README.md#examples) of the docs entry page.
