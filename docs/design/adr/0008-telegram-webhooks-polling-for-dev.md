# 0008. Telegram: webhooks in production, long polling only for local dev

- **Status:** Accepted
- **Date:** 2026-10-02

## Context
Telegram delivers bot updates either by webhook (Telegram pushes to our HTTPS endpoint) or by long polling (`getUpdates`, where we pull). The two are mutually exclusive per bot. Only one `getUpdates` caller per bot is allowed at a time; a second one gets `409 Conflict`. We host many customers' bots (multi-tenant), and `gateway` is designed to be stateless.

## Decision
- **Production uses webhooks only.** `setWebhook` is called with a `secret_token`, and the token is checked on every update.
- The Telegram adapter has **one entry point**, `handleTelegramUpdate(channelId, update)`: de-duplicate → save → enqueue. Transports sit in front of it.
- **Local development** can use a **polling transport** (`TELEGRAM_TRANSPORT=polling`) with developers' own BotFather test bots. Production bot tokens are never used locally.

## Consequences
- `gateway` stays stateless and scales freely; idle bots cost nothing; Telegram retries delivery until we return 200.
- Local development needs no public URL or tunnel.
- If production polling is ever needed (e.g. an on-premise install behind NAT), it becomes a separate `telegram-poller` process role with a per-bot lease in Redis and a stored `offset`. The ingest logic stays the same.

## Alternatives considered
- **Long polling in production:** one always-open request per bot; each bot pinned to one pod (leases, rebalancing on scaling or crashes); offsets that must be stored and confirmed only after saving. It makes ingress stateful and sharded for no benefit, since we have a public HTTPS endpoint.
- **A tunnel for local dev (cloudflared / ngrok):** works, but every developer needs a tunnel and a webhook re-registration. Polling is simpler.
