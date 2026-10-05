# 010 Live updates

[Back to the docs](../README.md)

## What it is

A live update is a small push to a browser tab that is open right now: "something changed, look again". The server publishes it to a Redis pub/sub channel. A GraphQL subscription over `graphql-ws` carries it to the tab.

It is best effort. Nothing is stored, retried or replayed.

## Why we have it

Without it, a screen would have to ask the server every few seconds whether anything is new. That is slow for the user and wasteful for the server.

A live update is cheap and fast, and that is why it makes no promises. If a tab was closed or offline, it misses the push and loads fresh data when it opens. The database stays the source of truth. A live update only says "refetch".

## How it works

```
use case                                 browser tab
  | liveUpdates.publish(channel, event)    ^  graphql-ws
  v                                        |
after-commit buffer --(commit)--> Redis PUBLISH
                                      |
                       api process: one shared SUBSCRIBE connection
                                      |  fan out in memory
                                      v
                       subscription resolver --> async generator --> tab
```

1. **Define the channel.** `defineChannel({ name, schema })` names it and says what an event looks like. The schema holds flat values only: strings, numbers, booleans and null.
2. **Pick the key.** `channelFor(definition, ...segments)` builds the Redis key, `topic:<name>:<segment>:...`. Put the workspace id in a segment, so one workspace never hears another.
3. **Publish.** `LiveUpdatesService.publish(channel, event)` checks the event against the schema and waits for the commit. A rolled-back transaction publishes nothing.
4. **Share one connection.** Each process keeps one Redis subscriber connection. It subscribes to a key when the first listener arrives and unsubscribes when the last one leaves.
5. **Subscribe.** `LiveUpdatesService.subscribe(channel)` returns an async generator of checked events. When the client disconnects, the generator ends and the listener is released.

The WebSocket is served by the same GraphQL server, through its `graphql-ws` setup. On connect, the server resolves the actor from the `authorization` connection parameter and refuses the connection if that fails. Each operation then gets its ctx from the `authorization` and `x-workspace-id` parameters, like an HTTP request does. The web app already sends subscription operations over a `graphql-ws` link.

## Guarantees

None. Know what that means:

- Redis pub/sub keeps no messages. A tab that is not connected at that moment never gets it.
- If the publish fails after the commit, the error is reported and not thrown. There is no retry.
- A live update is a hint. It is not the data.

If losing the message would break something, it is not a live update. Use a durable job (page 008).

## Example use (hypothetical)

Not built: no module defines a channel, no resolver subscribes, and the GraphQL schema has no `Subscription` type yet. The names below are invented.

A customer writes. An operator has the Inbox open and should see the message without reloading.

```
1. gateway use case saves the message (one transaction)
      liveUpdates.publish(channelFor(inboxChannel, workspaceId), { conversationId, messageId })
2. after the commit: Redis PUBLISH on topic:inbox:<workspaceId>
3. every api process with an open Inbox gets it from its shared subscriber
4. the subscription resolver yields the event to the operator's tab
5. the tab refetches the conversation list
```

- The channel would live in `modules/<m>/channels/` and hold IDs only, never message text.
- The subscription resolver calls one use case. It checks that the user may see this workspace's Inbox, then returns `subscribe(channel)`.
- The tab refetches after a reconnect too, because it may have missed events while offline.

## In the code

- [platform/live-updates/](../../apps/backend/src/platform/live-updates/): the whole feature.
- [channel.helpers.ts](../../apps/backend/src/platform/live-updates/helpers/channel.helpers.ts): `defineChannel` and `channelFor`.
- [live-updates.service.ts](../../apps/backend/src/platform/live-updates/services/live-updates.service.ts): `publish` and `subscribe`.
- [channel-publisher.service.ts](../../apps/backend/src/platform/live-updates/services/channel-publisher.service.ts) and [channel-subscriber.service.ts](../../apps/backend/src/platform/live-updates/services/channel-subscriber.service.ts): the two Redis connections, and the counting of listeners per key.
- [channel-stream.helpers.ts](../../apps/backend/src/platform/live-updates/helpers/channel-stream.helpers.ts): the async generator that checks each message.
- [graphql-options.service.ts](../../apps/backend/src/platform/graphql-server/services/graphql-options.service.ts): the `graphql-ws` setup, the connection check and the ctx for subscriptions.
- [splitLink.helpers.ts](../../apps/web/src/shared/api/helpers/splitLink.helpers.ts): the web side. Subscriptions go over `graphql-ws`, the rest over HTTP.
- Spec: [live-updates.service.spec.ts](../../apps/backend/src/platform/live-updates/services/live-updates.service.spec.ts) shows delivery, separate channels, the drop on rollback and a shared channel.

## Pitfalls

- Never render the event as the data. Send IDs, then refetch. The event may be late or missing.
- Put the workspace id in the channel key, and check access in the subscription's use case. The channel key alone does not protect anything.
- The event holds flat values only. A nested object does not fit the type.
- Do not publish to Redis directly. Use `LiveUpdatesService`, so the publish waits for the commit.
- Publish and subscribe use the queue Redis connection, not the cache one (page 002).

Next: [011 Async at a glance](011-async-at-a-glance.md)
