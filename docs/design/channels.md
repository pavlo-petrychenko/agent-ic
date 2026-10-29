# Channels module

**Status:** partly implemented, October 2026. Telegram works end to end for message exchange: connect, receive, answer, raise an escalation inside the flow, replace the token, disconnect and delete. The operator side of escalation is still simulator-only. The API channel exists only as a web prototype. Viber, WhatsApp and a provider-neutral ingress contract do not exist yet.

**Decisions:** D210 (incoming messages), D211 (channel adapters and outbound delivery), D288 (Telegram webhook ingress), ADR 0008 (webhooks in production, long polling only for local development).

**Scope:** one channel record per bot or API integration, its sealed credentials, transport setup, ingress de-duplication, translation into a conversation message, outbound delivery through a channel adapter, and the channel lifecycle. It also covers what a customer, an operator and the agent see when a chat escalates or ends.

**Not in this document:** the full API-channel contract, the web widget, knowledge bases, and the internal run engine except where a channel message starts one.

---

## 1. What the module does

A channel is one way customers reach one agent. A Telegram bot is one channel; a business's own API integration is another. One channel answers with one agent's **live published version**; one agent can have many channels.

The module owns:

- the channel record: provider kind, external bot or account id, identity, who answers, typing setting;
- sealed credentials (Telegram bot token and webhook secret hash, later an API secret hash);
- transport setup and teardown (Telegram webhook or polling);
- ingress de-duplication in `channels.channel_events`;
- translation from a provider update to `IncomingMessagesService.handleIncomingMessage`;
- outbound delivery through a `ChannelAdapter`;
- channel status and lifecycle actions.

It does **not** own conversations, messages, runs, escalation state or notifications. Those belong to `conversations`, `runs` and `notifications`. The channel module is the boundary between an external messenger and those modules.

### 1.1 In plain words

A customer writes to a Telegram bot. Telegram calls our public webhook, or in local development we poll Telegram for updates. We check the update, drop a duplicate, find or open the customer's conversation and save the message. If the agent is active, a durable event starts a run. The run decides what to say; every outgoing message is saved with an idempotency key and queued. A worker picks it up and a Telegram adapter sends it to the customer's chat, with typing and rate limits.

The agent never talks to Telegram directly. Only the Escalation and Send message steps, or an operator reply, produce outgoing messages, and all of them use the same outbound path.

### 1.2 Built today

| Area | State |
|---|---|
| Telegram connect, update who answers, typing toggle | Works |
| Telegram webhook ingress in production | Works |
| Telegram long polling for local development | Works |
| Telegram text replies, typing action, per-bot and per-chat rate limits | Works |
| Duplicate update and duplicate message protection | Works |
| Replace token, disconnect, delete | Works |
| Conversation pause, escalation, hand back in the simulator | Works through `conversations` and `runs` |
| Telegram status `broken` | Defined in the schema, never set by code |
| Last customer message and 7-day channel stats | Not exposed; the UI currently shows the channel's `updatedAt` as "last update" |
| Outbound quick-reply buttons | Gateway support exists, but the adapter sends an empty list; `callback_query` is not handled |
| API channel backend | Not built; the web screens use mocks |
| Viber, WhatsApp, web widget | Not built |
| Inbox, operator alerts, escalation reminders and fallback | Not built; the channel side of escalation therefore pauses silently |

---

## 2. Domain model

```
agent 1 ── n channel 1 ── n channel_event
                    │
                    └── conversation (channel kind and channel id kept as context)
```

| Concept | Meaning |
|---|---|
| **Channel** | One bot or API integration. Holds `kind`, `external_id` (Telegram bot id), identity, `agent_id`, `show_typing`, sealed credentials and status. |
| **External id** | The provider's stable id for this integration. `(kind, external_id)` is unique across the whole system, so the same bot cannot be connected twice, even in two workspaces. |
| **Identity** | Display data from the provider: Telegram username and first name, or an API channel name. It is not a credential. |
| **Credentials** | Sealed JSON. Telegram: `bot_token` plus a hash of the webhook secret. API: a secret-key hash. The raw secret is shown or used only once. |
| **Channel event** | One accepted incoming provider event, unique by `(channel_id, external_id)`. This is the ingress de-duplication record. |
| **Status** | `pending`, `connected`, `broken`, `disconnected`. See below. |

A conversation stores `channel_kind` and `channel_id` as context. Deleting a channel therefore leaves past conversations, messages and runs visible. The deleted channel can be connected again with the same bot id.

### 2.1 Status model

| Status | Meaning | Who sets it |
|---|---|---|
| `pending` | The row exists and the transport is being configured. A retry of connect reuses this row. | `connectTelegram` while preparing |
| `connected` | Telegram calls our webhook, or polling is active; sends are allowed. | `connectTelegram`, `replaceTelegramToken` |
| `broken` | The provider rejected the token or stopped delivering. The fix is to replace the token. | **Design only; no code sets it today** |
| `disconnected` | The webhook was removed and no new messages arrive. Past conversations remain. | `disconnectTelegram` |

There is no automatic transition to `broken`. A failed send marks the **message** failed and the job retries; the channel keeps its `connected` status.

---

## 3. Connection flow

### 3.1 Telegram today

```
browser                    api                         Telegram
   │  connectTelegram         │                            │
   ├─────────────────────────▶│  channels:edit              │
   │                          │  agent must exist           │
   │                          │  getMe(token) ─────────────▶│
   │                          │◀───────────── bot id/name   │
   │                          │  seal token + webhook hash  │
   │                          │  insert channel(pending)    │
   │                          │  setWebhook(url, secret) ──▶│
   │                          │  (or deleteWebhook in dev)  │
   │                          │  channel = connected        │
   │◀─────────────────────────┤  masked token only          │
```

1. The user opens **Channels → Connect a Telegram bot**, pastes a BotFather token, picks the answering agent and optionally enables typing.
2. `connectTelegram` authorizes `channels:edit` and checks that the agent belongs to the workspace.
3. `TelegramChannelService.readBot` calls Telegram `getMe`. `401` and `404` become `TelegramTokenInvalidError`; other failures stay upstream errors.
4. Credentials are sealed with `SecretBoxService`: the bot token and a hash of a fresh random webhook secret. The raw webhook secret is used only to register the webhook and is never stored.
5. `ChannelConnectionService.prepare` finds an existing channel by `(workspace, kind, external id)`:
   - if it is already `connected`, the request fails as already connected;
   - if it exists in another state, the row is updated to `pending` with the new agent and credentials;
   - otherwise a new `pending` row is inserted.
6. `configureTransport` is synchronous:
   - webhook mode: `setWebhook` to `/webhooks/telegram/{workspacePublicId}/{channelPublicId}` with a `secret_token` and the allowed update types;
   - polling mode: `deleteWebhook`, so no webhook competes with the local poller.
7. `complete` moves the channel to `connected` and returns the public view. `tokenMasked` is the only token material in the response.

The external call is deliberately outside the database transaction. If `setWebhook` fails, the row stays `pending`, and a second connect with the same bot reuses and repairs it.

### 3.2 Update, replace, disconnect, delete

| Action | Permission | What happens |
|---|---|---|
| **Change who answers / typing** | `channels:edit` | Validates the agent, updates `agent_id` and `show_typing`. The next message uses the new agent; an in-flight run keeps its pinned version. |
| **Replace token** | `channels:edit` | Calls `getMe`, requires the same bot id, re-registers the transport with a new secret, replaces sealed credentials, returns to `connected`. A revoked bot is repaired this way. |
| **Disconnect** | `channels:delete` | Deletes the webhook, sets `disconnected`. The row and history stay. Telegram messages are no longer received. |
| **Delete** | `channels:delete` | Removes the webhook unless already disconnected, then deletes the channel row. `channel_events` cascade. Conversations, messages and runs stay; the bot id is free to connect again. |

Every action is synchronous from the user's point of view: they see a transport error immediately, not a background failure.

---

## 4. Conversation flow

### 4.1 Inbound

```
Telegram
   │ webhook (production) or getUpdates (local dev)
   ▼
gateway controller / poller
   ▼
TelegramUpdatesService.handleTelegramUpdate
   │ load channel, check status and webhook secret
   │ insert channel_event, unique (channel_id, update_id)
   │ map message → IncomingMessageInput
   ▼
IncomingMessagesService.handleIncomingMessage
   │ find or open the conversation
   │ save the customer message
   │ route by conversation state and agent pause
   ▼
durable conversations.message-received
   ▼
runs: start-run listener → run of the live version → outbound messages
```

![Inbound message flow](https://github.com/pavlo-petrychenko/agent-ic/blob/pr-assets/channels/docs/indound-message-flow.png?raw=true)

*Inbound message flow: from a Telegram update to a run.*

1. **Ingress.** The webhook is `POST /webhooks/telegram/:workspacePublicId/:channelPublicId` on the `gateway` role. In local development the same logic is fed by `TelegramPollerService`, which is started only when `TELEGRAM_TRANSPORT=polling`.
2. **Channel checks.** The service loads the channel inside a tenant transaction. In webhook mode it compares `x-telegram-bot-api-secret-token` with the sealed webhook secret hash. An unknown channel is `404`, a bad secret is `401`, a body that is not a valid update is `422`. A disconnected channel or a non-message update returns `200` without writing, so Telegram stops retrying.
3. **De-duplication.** The update is inserted into `channels.channel_events`, unique by `(channel_id, external_id)`. A repeated update is ignored before any conversation work.
4. **Mapping.** `toIncomingMessageInput` accepts text only. It sets `mode: live`, `channelKind: telegram`, `channelId`, `endUserExternalId` = Telegram chat id, `endUserName` = sender first name, and `externalId` = Telegram message id. Empty text, media-only messages and a channel without an agent produce no conversation message.
5. **Conversation.** `IncomingMessagesService` finds the open conversation for `(workspace, agent, mode, channel kind, end user)` under an advisory lock, or opens one. It saves the message and routes:
   - `waiting` or `handled`: save only; no run and no new alert;
   - agent paused in `inbox` mode: move to `waiting` with `needs-operator` (`agent_paused`);
   - agent paused in `away_message` mode: send the away text once per pause;
   - otherwise emit durable `conversations.message-received`.
6. **Run.** The run module starts one run of the agent's live version, claims the conversation, and merges messages that arrive while it runs into one follow-up run. See [How a run works](../learn/018-how-a-run-works.md).
7. **Response.** The webhook returns `200 { ok: true }`. Telegram's retry policy is satisfied by the durable event and outbox path, not by holding the HTTP request open.

The polling transport keeps offsets in memory per bot. The offset advances only after the update is handled. `channel_events` makes a replay after a restart harmless. Two pollers for the same bot, or a poller plus a registered webhook, conflict at Telegram with `409`.

### 4.2 Outbound

```
Send message / Escalation / operator reply
   ▼
recordOutbound: message row + stable idempotency key
   ▼ durable conversations.outbound-queued
outbound queue → DeliverOutboundMessageUseCase (system actor)
   ▼
ChannelAdapterRegistry.adapterFor(kind)
   ▼
Telegram adapter: load channel, open token, rate limits, typing, sendMessage
   ▼
message delivered / failed
```

![Outbound message flow](https://github.com/pavlo-petrychenko/agent-ic/blob/pr-assets/channels/docs/outbound-message-flow.png?raw=true)

*Outbound message flow: from `recordOutbound` to the provider.*

- Every outgoing message is recorded before delivery. Its key is `run:<run>:node:<node>:<index>` for a flow step, `operator:<id>` for an operator reply, or `away:<conversation>:<paused_at>` for an away message.
- The delivery use case skips a message already marked `delivered`, so an at-least-once outbox retry does not duplicate it.
- A simulation conversation always goes through `SimulatedChannelAdapter`, whatever its stored channel kind. The transcript is in memory in the worker and is capped per conversation set.
- A failed send marks the message `failed` and rethrows, so the job retries. If the mark itself fails, the delivery error is still the one thrown and logged.

### 4.3 What the customer sees

- Text replies only. Each item of an agent's `messages[]` becomes one chat message.
- Telegram typing is sent before a message when the channel has typing enabled.
- Buttons are planned but not delivered today: the Telegram gateway can build inline keyboards, but `TelegramChannelAdapter` passes `quickReplies: []`.
- There is no read receipt, edit, reaction, attachment or media handling yet.

---

## 5. Adding a provider: WhatsApp, Viber or another messenger

### 5.1 What already works for you

A new provider does not need to touch conversations, runs, escalation or the outbound queue. It plugs into four boundaries:

| Boundary | Reuse |
|---|---|
| Conversation entry | `IncomingMessagesService.handleIncomingMessage` with an `IncomingMessageInput`. It already handles conversation opening, duplicate messages, pause states, away messages and the durable run event. |
| Outbound delivery | Implement `ChannelAdapter` and register it under `CHANNEL_ADAPTERS`. The outbound listener and retry path do the rest. |
| Storage | `channels.channels` already has `kind`, `external_id`, `identity`, sealed credentials and status. Add a provider variant to the identity and credentials unions. |
| Lifecycle | Copy the Telegram pattern: validate credentials with the provider, prepare a `pending` row, configure the transport, mark `connected`; add replace, disconnect and delete. |

What does **not** exist yet is a provider-neutral **inbound** abstraction. Telegram's controller, update schema, mapper and poller are Telegram-specific. A second provider should introduce a general ingress contract rather than copy `TelegramUpdatesService` wholesale.

### 5.2 Checklist for a new provider

1. **Kind.** Add the kind to `ChannelKind` and the provider lists in `packages/contracts/src/channels/channel.constants.ts`. Add a database enum migration for `channels.channel_kind`. Add it to the GraphQL `ChannelKind` enum and its mapper, then to the web channel kind, route and icon constants.
2. **Identity and credentials.** Extend `ChannelIdentity` and `ChannelCredentials`. Example: Viber auth token and sender id; WhatsApp phone-number id, business account id and access token. Decide what may be shown masked and what is sealed.
3. **Provider gateway.** Add an abstract HTTP gateway with a fake for tests, like `TelegramGateway` and `HttpTelegramGateway`. Put timeouts, error mapping and retry-after handling there, not in the use case.
4. **Transport setup.** Decide whether the provider supports webhooks, polling or both. Implement connect, replace and disconnect for that transport. Register or remove the webhook, or start and stop polling.
5. **Inbound adapter.** Add a controller in the `gateway` role, or a poller when the provider has no webhook. Verify the provider's signature or secret, parse the payload with a zod schema, map it to `IncomingMessageInput`, and de-duplicate with the provider's stable event or message id. Reuse the existing `channel_events` pattern.
6. **One entry point.** The inbound service should call `IncomingMessagesService.handleIncomingMessage` once. It must not write conversations, messages or runs itself. That keeps pause, escalation and run rules in one place.
7. **Outbound adapter.** Implement `ChannelAdapter.send`: load the channel, open credentials, apply the provider's rate limits, send text, and map provider errors. Register it in `channels.module.ts` under `CHANNEL_ADAPTERS`.
8. **Delivery features.** Decide what maps to the existing `ChannelOutboundMessage`: plain text only, or also quick replies. If buttons are sent, the inbound side must handle the provider's callback payload as a customer message. Do not ship buttons that cannot be answered.
9. **Status and health.** Mark `broken` on a revoked token. Store or expose the last inbound event, last error and message counts. The current Telegram UI uses `updatedAt`, which is a settings timestamp, not a customer message.
10. **Tests and docs.** Add ingress, outbound and lifecycle specs, plus a provider section here. The existing Telegram specs are the reference: webhook secret, duplicate update, polling, connect, replace, disconnect and delete.

### 5.3 Provider rules that leak into UX

These are not implementation details; they change the product promise:

- **WhatsApp** has a 24-hour customer-service window. Replies outside it need approved templates. The flow builder and the channel settings must say this before an agent promises a reply next week.
- **Viber** uses bot accounts and keyboards with their own limits. Quick replies and menu labels need a provider-specific renderer.
- **Telegram** allows a bot to message a user only after the user has written to it, which matters for scheduled follow-ups.
- **Media** is provider-specific. A consistent attachment model is a larger change than a new text adapter.

### 5.4 Where not to add provider code

Do not put provider checks in `conversations`, `runs`, `agents` or the flow engine. Do not let a channel adapter create messages. Do not write directly into another module's tables. The boundary is: provider code in `channels`, conversation rules in `conversations`, flow rules in `runs`.

---

## 6. Agents, escalation and end of conversation

### 6.1 Who answers

- A channel points at one agent. A live conversation always runs the agent's **published live version at the moment the run starts**; an in-flight run keeps the version it started with.
- A draft is never used for a live channel. A paused agent follows the pause behaviour described above, and an unpublished or deleted agent starts no run.
- Changing the agent on a channel applies to the next message. Changing typing applies to the next send.
- One agent can answer several channels. The same customer id from two bots is currently treated as the same end user for that agent, because the conversation key uses channel kind, not channel id. That is a risk called out below.

### 6.2 Escalation

Escalation is a **branch the flow author builds**, not a sentiment detector. The usual flow is a Completion guard, a Router, and an Escalation node for “needs a person”; an Agent step's `error` port can also go there.

When the flow reaches Escalation in `escalate` mode:

1. It sends the optional customer message through the normal outbound path.
2. It moves the conversation from `agent_active` to `waiting`. The update only succeeds from `agent_active`, so a retry cannot notify twice.
3. It emits `conversations.needs-operator` and durable `runs.escalated`.
4. The run ends as `escalated`. No follow-up run starts, because the conversation is no longer `agent_active`.
5. Customer messages that arrive while `waiting` or `handled` are saved, but no run starts and the agent does not answer.
6. An operator reply moves the conversation to `handled` and sends an operator message. Hand back returns it to `agent_active` and clears the operator, but starts no run. The agent answers the next customer message, with the whole history, including the operator messages.
7. An Escalation inside a waited Parallel branch ends the whole run; other branches stop before their next step. It is refused in a background branch.

**What the customer sees:** the escalation message, then silence from the agent. Their later messages are not answered by the agent.

**What the operator sees today:** only the Testing simulator can reply as an operator and hand back. The live Inbox is not built. The escalation reason is stored in the Escalation step's `run_steps.output`, not in a separate escalation row, and live runs are not exposed through the current run API.

**What is missing:** operator notifications, the Inbox, “take over” as a separate action, reminders after 5 minutes, and the fallback message after 30 minutes. The fields exist in the flow and builder, but no listener or timer reads them. An escalation therefore pauses a real Telegram chat without telling anyone.

![Escalated chat and operator hand-off](https://github.com/pavlo-petrychenko/agent-ic/blob/pr-assets/channels/docs/escalated-chat.png?raw=true)

*Escalation and operator hand-off in the same Telegram chat.*

### 6.3 End of conversation

A conversation ends only when the flow reaches Escalation in `end` mode. The flow author decides the reason: a Router after “is the customer done?”, a goodbye after a booking, or a guard fallback. There is no idle timeout and no operator close action in the current API.

When End runs:

1. It sends the optional goodbye through the outbound path.
2. It sets the conversation to `closed` and records `closed_at`.
3. The run ends as `succeeded`, not `escalated`.
4. The next customer message opens a **new conversation**, with a new id.

**Memory.** The agent does not carry messages across conversations. `ConversationHistoryService` reads only the current conversation, so a new conversation starts with no message history. Old conversations and messages are not deleted; they stay in Postgres for the future Inbox history. The Telegram chat id and sender name still identify the same person, because the channel supplies them again, but there is no contact profile or cross-conversation memory module yet.

So “the agent forgets” means: it cannot use what was said before `closed` when answering after the end. It does not mean the data is erased.

### 6.4 The main points

| Question | Current answer |
|---|---|
| When does a chat escalate? | When the flow reaches an Escalation step in `escalate` mode. Not automatic on model or run failure. |
| Does escalation end the conversation? | No. It pauses the conversation; the run ends and the state is `waiting`. |
| What does the customer see? | The escalation message, then no agent replies until an operator replies or hands back. |
| What does an operator see? | In the simulator, the chat and a reply/hand-back control. In production, nothing yet. |
| When does a chat end? | Only when the flow reaches an Escalation step in `end` mode. There is no idle close and no Inbox close. |
| Does the agent remember after the end? | No message history is carried into the new conversation. Old data is retained but not read. |
| Is a failed Agent step escalated? | Not automatically. Connect the `error` port to an Escalation step, or the run fails. |

---

## 7. Suggestions for a better experience

### 7.1 Product and UX

1. **Finish the hand-off before calling it live.** A real escalation must notify someone, show the chat in an Inbox, and have a fallback when nobody comes. Right now the flow pauses and the customer waits indefinitely. This is the largest gap in the channel story.
3. **Detect `broken` automatically.** A `401` or repeated webhook failure should mark the channel `broken`, stop pretending it is connected, and email owners and admins. The UI already has the state and copy.
4. **Make `pending` recoverable and visible.** If webhook registration fails, show “Connecting failed, retry” instead of an unexplained pending row. A retry already repairs the same row.
6. **Give the customer a clear end.** The End step can send a goodbye, but there is no operator close and no customer-visible “chat closed” event in Telegram. Decide whether ending is silent (new conversation next time) or explicit; consistency matters more than the mechanism.
5. **Offer memory as a choice.** A “continue from the last conversation” setting, backed by a short summary or a contact profile, would remove the most jarring “the bot forgot me” moment. Keep it opt-in because retention and privacy differ per business.


---

## 8. What is not implemented and needs attention

| Priority | Item | Why it matters |
|---|---|---|
| High | Operator alerts, Inbox, take over, reminders and fallback | Escalation currently pauses a live chat silently. The flow fields exist but nothing reads them. |
| High | Include the channel in the conversation identity | Two bots for one agent can share a conversation. |
| High | `broken` detection and owner/admin email | A revoked token looks connected while every send fails. |
| Medium | API channel backend | The UI is a prototype; it cannot create, receive or send yet. |
| Medium | Quick replies and callback handling | The Telegram gateway supports keyboards, but the adapter drops them and callbacks are ignored. |
| Medium | Last inbound event, delivery errors and 7-day stats | The UI currently reports a settings timestamp as channel activity. |
| Medium | Provider-neutral ingress contract | A second provider would otherwise copy Telegram's controller and poller. |
| Medium | Close from the Inbox | Only the flow's End step can close a conversation. |
| Medium | Cross-conversation memory | A new conversation starts with no history. A summary or contact profile is needed for continuity. |
| Low | Media and attachments | Text only today. Every provider has a different model. |
| Low | Web widget | Not a channel adapter yet. |

---

## 9. References

### Design and product docs

- [MVP scope](mvp-scope.md): UC-9 connect channels (line 446), UC-10 a customer conversation (line 461), UC-11 escalation and hand-off (line 477), §12.8 channels (line 653), §12.9 conversation runtime (line 666), §12.10 Inbox (line 687).
- [Communication chains](communication.md): chain A Telegram message to reply (line 84), chains B and C API channel (line 115), chain F escalation to operator (line 138), chain K Telegram lifecycle (line 190).
- [Architecture](architecture.md): D4 separate gateway, D16 gateway stays REST, D21 Telegram transport, D35 where provider clients live, D210 incoming messages, D211 channel adapters and outbound delivery, D288 Telegram webhook ingress.
- [ADR 0008: Telegram webhooks in production, long polling only for local dev](adr/0008-telegram-webhooks-polling-for-dev.md).
- [ADR 0015: jobs after commit and the durable outbox](adr/0015-jobs-after-commit-and-durable-outbox.md).
- [How a run works](../learn/018-how-a-run-works.md): the conversation-to-run path, escalation semantics and simulation.

### Code

- `apps/backend/src/modules/channels/`: module, GraphQL, resolvers, use cases, services, repositories, gateways, adapters, webhook controller, poller and outbound listener.
- `apps/backend/src/modules/channels/use-cases/connect-telegram.use-case.ts`, `replace-telegram-token.use-case.ts`, `disconnect-telegram.use-case.ts`, `delete-channel.use-case.ts`: channel lifecycle.
- `apps/backend/src/modules/channels/services/channel-connection.service.ts` and `telegram-channel.service.ts`: pending/connected transition and transport registration.
- `apps/backend/src/modules/channels/use-cases/handle-telegram-webhook.use-case.ts`, `services/telegram-updates.service.ts`, `helpers/telegram-update.helpers.ts`: Telegram ingress.
- `apps/backend/src/modules/channels/gateways/channel-adapter.gateway.ts`, `telegram-channel-adapter.gateway.ts`, `simulated-channel-adapter.gateway.ts`: outbound adapters.
- `apps/backend/src/modules/channels/use-cases/deliver-outbound-message.use-case.ts`, `listeners/deliver-outbound-message.listener.ts`: outbound queue path.
- `apps/backend/src/modules/conversations/services/incoming-messages.service.ts`, `constants/incoming-message.constants.ts`: conversation opening and pause routing.
- `apps/backend/src/modules/runs/services/escalation-executor.service.ts`, `run-execution.service.ts`, `run-lifecycle.service.ts`: escalation and end of run.
- `apps/web/src/features/channels/`: the Channels screens, Telegram bot pages and the mock API-channel prototype.
