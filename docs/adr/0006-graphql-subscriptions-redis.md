# 0006. Realtime through GraphQL subscriptions over Redis pub/sub

- **Status:** Accepted
- **Date:** 2026-10-02

## Context
The Inbox (new messages, take-over and hand-back) and the simulator (live step trace) need updates pushed from the server. `api` runs as several replicas. Events start in any process: `worker-runs` (steps), `gateway` (new customer messages), or another `api` pod (an operator's action). An in-memory PubSub only reaches clients on the same pod.

## Decision
- **GraphQL subscriptions** over WebSocket (`graphql-ws`), typed by the same schema and codegen as queries.
- **Redis pub/sub** carries events between processes. Every publisher writes to Redis. Every `api` pod subscribes and forwards events to its own connected clients, after checking authorization and filters.
- Channels are scoped to keep fan-out small: `ws:{workspaceId}:inbox`, `conv:{conversationId}:messages`, `run:{runId}:steps`.
- Events say **what changed**; queries stay the source of truth. After a reconnect, the client refetches its queries.

## Consequences
- No sticky sessions are needed. Deploys and scale-down drop sockets, and `graphql-ws` reconnects with backoff.
- Missed events are harmless (refetch on reconnect), so pub/sub's fire-and-forget delivery is acceptable.
- Keepalive pings every ~20 s stay under the idle timeouts of the ALB, Traefik and Cloudflare Tunnel.
- The ingress must support WebSocket upgrades. `api` scales on open connections as well as CPU.

## Alternatives considered
- **SSE plus refetching GraphQL on events:** plain HTTP, but events would sit outside the schema contract.
- **An in-memory PubSub:** works locally, but silently loses about (N−1)/N of events with N replicas.
- **Redis Streams with replay:** not needed, because refetch-on-reconnect covers gaps.
