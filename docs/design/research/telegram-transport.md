# Telegram transport: native TypeScript vs bot libraries

**Status:** research, 2026-10-22.

This note compares a small native Telegram client with full bot frameworks for `modules/channels`. It is not a decision record; if the recommendation changes, add an ADR or a row in [architecture.md](../architecture.md).

## Context and constraints

The app is a multi-tenant platform, not a single Telegram bot:

- many customer bots, each with its own token;
- one stateless `gateway` Deployment receives Telegram webhooks;
- `api` validates tokens and registers/removes webhooks;
- workers send outbound messages and run agents;
- BullMQ owns retries and durable delivery;
- Redis owns per-bot and per-chat rate limits;
- Postgres owns channel state, credentials and update deduplication;
- a later platform-wide alerts bot uses Telegram too.

Relevant current decisions:

- ADR 0008: production uses webhooks only; polling is a local-dev transport. The ingest entry point is `handleTelegramUpdate(channelId, update)`.
- ADR 0010: external systems are abstract gateway classes with real and fake implementations.
- D35: single-module clients stay in their module.
- D211: `ChannelAdapter` and `ChannelAdapterRegistryService` select an adapter by channel kind.
- `docs/rules/testing.md`: only external gateways are faked; tests never call Telegram.

## Options

### A. Pure TypeScript HTTP client

Use Node 24 `fetch` and the Bot API directly:

```text
HttpTelegramGateway
  getMe
  setWebhook
  deleteWebhook
  getWebhookInfo
  sendMessage          (later)
  sendChatAction       (later)
  getUpdates           (local polling, later)
```

No Telegram runtime dependency.

### B. Native runtime + type-only package

Keep the same client, but import Bot API payload types from a type-only package such as `@grammyjs/types`, `typegram` or `@telegraf/types`.

The package supplies `Update`, `Message`, `CallbackQuery`, `InlineKeyboardMarkup` and similar shapes at compile time. It does not create a bot instance, poll, dispatch handlers or retry.

### C. grammY

A TypeScript-first bot framework with bot instances, middleware, webhook helpers, media helpers, sessions and a low-level `Api` client.

### D. Telegraf

A mature bot framework with middleware, context objects, scenes, webhook helpers and a low-level `Telegram` client.

### E. node-telegram-bot-api

An older, polling-first client. It supports webhooks, but its model and documentation are oriented around a long-lived bot instance.

## Comparison

| Criterion | Pure TypeScript | Types-only + native | grammY | Telegraf | node-telegram-bot-api |
| --- | --- | --- | --- | --- | --- |
| Multi-tenant bot tokens | Excellent | Excellent | Possible with care | Possible with care | Possible with care |
| Stateless webhook gateway | Excellent | Excellent | Framework-shaped | Framework-shaped | Polling-shaped |
| Queue-owned retries | Full control | Full control | Must disable/verify | Must disable/verify | Must verify |
| Per-bot rate limits across pods | Our Redis limiter | Our Redis limiter | Our Redis limiter | Our Redis limiter | Our Redis limiter |
| Error mapping to `UpstreamError` | Exact | Exact | Translate framework errors | Translate framework errors | Translate errors |
| Token redaction | Full control | Full control | Audit library logging | Audit library logging | Audit library logging |
| Bot API update types | Manual | Included | Included | Included | Included |
| Media uploads | Manual `FormData` | Manual `FormData` | Helpers | Helpers | Helpers |
| Inline keyboards | Manual JSON | Manual JSON | Helpers | Helpers | Helpers |
| Long polling for local dev | We add it | We add it | Built in | Built in | Built in |
| Runtime dependency | None | None | Framework | Framework | Framework |
| Future alerts bot | Same client | Same client | Another bot instance | Another bot instance | Another bot instance |
| Fit with ADR 0008/0010 | High | High | Medium | Medium | Low |

## Detailed trade-offs

### A. Pure TypeScript

**Pros**

- Matches the stateless gateway and queue-first design.
- No bot lifecycle, middleware, session or polling assumptions.
- One token parameter per call; no in-memory bot registry.
- Exact control over timeouts, errors, retries, rate limits, metrics and logging.
- Easy to fake at the `TelegramGateway` boundary.
- Consistent with the existing native Resend and outbound-HTTP clients.

**Cons**

- The Bot API types must be written or imported separately.
- Media uploads, entities, keyboards and callback queries are manual.
- More code as the feature grows.
- More chance of missing a Bot API edge case.

This is the best fit for the connection and ingress paths: `getMe`, `setWebhook`, `deleteWebhook`, `getWebhookInfo` and raw webhook handling.

### B. Native runtime + type-only package

**Pros**

- Keeps all the control of the native client.
- Removes most of the type-maintenance risk, especially for `Update`.
- No runtime dependency or framework lifecycle.
- The types can be used by the webhook parser, the fake and the outbound adapter.

**Cons**

- One more package in the dependency graph, even if type-only.
- Types can lag behind a new Bot API field.
- Still manual for media, keyboards and method calls.

This is the best overall fit. Use native `fetch`; add type-only packages when webhook parsing starts.

### C. grammY

**Pros**

- Excellent TypeScript support.
- Strong webhook support and useful media/keyboard helpers.
- Good documentation and community.
- A lower-level `Api` client can be used without the bot handler layer.

**Cons**

- The framework expects a bot instance and handler model.
- With many customer bots, you must avoid per-request bot construction or a growing bot-instance cache.
- The framework can own retries, context and middleware, which overlaps BullMQ and our `UseCaseCtx`.
- Its webhook callback dispatches to handlers; our webhook must deduplicate, persist and enqueue instead.
- Error classes must be translated back to `UpstreamError`.
- Token/logging behaviour must be audited.

A full grammY bot is not a good fit for the gateway. Its low-level `Api` wrapper is plausible, but it mostly duplicates the small native client.

### D. Telegraf

**Pros**

- Mature and widely used.
- Middleware, context and helpers for keyboards/media.
- Webhook support.

**Cons**

- Heavier framework model than needed.
- Context and middleware overlap our `UseCaseCtx` and use-case layer.
- More TypeScript friction than grammY.
- The same multi-tenant and stateless concerns as grammY.
- Error mapping and retry behaviour still need translation.

Suitable for a conventional single-bot product, less suitable for this platform.

### E. node-telegram-bot-api

**Pros**

- Simple API.
- Polling and webhook modes.
- Familiar to many Node developers.

**Cons**

- Polling-first design.
- Older codebase and typings.
- Long-lived bot instance model.
- Weak fit for a stateless, multi-tenant webhook gateway.
- Not recommended for new work here.

## What fits this codebase

### Connection lifecycle

Use native TypeScript:

```text
api:
  getMe(token)
  setWebhook(token, url, secret, allowedUpdates)
  deleteWebhook(token)
  getWebhookInfo(token)
```

A framework adds no value for four HTTP calls.

### Webhook ingress

Use native TypeScript:

```text
gateway:
  verify secret
  deduplicate update_id
  save channel event
  call IncomingMessagesService
  return 200
```

The framework handler model is the wrong abstraction. A types-only package for `Update` is useful; a runtime bot framework is not.

### Outbound delivery

Use native TypeScript inside `TelegramChannelAdapter`:

```text
load channel under RLS
decrypt credentials
enforce Redis rate limits
sendChatAction (optional)
sendMessage
map 401 / 403 / 429 / 5xx
mark delivered/failed
```

BullMQ must own retries. A library’s internal retries must not compete with it.

## Recommendation

```text
Runtime:            native fetch
Abstraction:        TelegramGateway + fake
Types:              own types for connection methods now;
                    type-only Telegram package when webhook parsing starts
Retries:            BullMQ
Rate limits:        Redis token bucket
Webhooks:           gateway controller
Polling:            optional local-dev transport only
Bot framework:      do not adopt as the runtime
```

A full framework becomes reasonable only if the product later becomes a rich single-tenant Telegram bot with interactive menus, payments, mini-apps and complex media workflows. Even then, use it as a low-level client behind `TelegramGateway`, not as the application structure.

## When to revisit

Revisit this note if:

- the product adds rich Telegram interactions that make manual media/keyboard code expensive;
- a provider-specific UI needs features that the types-only approach makes hard;
- the alerts bot grows into a full conversational bot;
- a second messaging provider shows that provider-specific gateways repeat the same transport code;
- library maintenance or an official SDK changes the balance.

If a full framework is chosen, document how it preserves:

- stateless gateway pods;
- one token per customer channel;
- webhook-only production;
- BullMQ retries;
- per-bot rate limits;
- token redaction;
- the `api` / `gateway` / `worker` split.

## References

- [ADR 0008](../adr/0008-telegram-webhooks-polling-for-dev.md)
- [ADR 0010](../adr/0010-nestjs-native-di.md)
- [Communication matrix](../communication.md)
- [Architecture decisions D21, D35, D211](../architecture.md)
- [Testing rules](../../rules/testing.md)
- [Resend email gateway](../../../apps/backend/src/modules/notifications/gateways/resend-email.gateway.ts)
- [Outbound HTTP gateway](../../../apps/backend/src/platform/outbound-http/gateways/outbound-http.gateway.ts)
