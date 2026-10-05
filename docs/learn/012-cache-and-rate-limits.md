# 012 Cache and rate limits

[Back to the docs](../README.md)

Two small platform services sit on top of the cache Redis: a typed cache and a token-bucket rate limiter.

## What it is

- **Cache.** `CacheService` stores JSON values in Redis under a typed key, with a time to live (TTL). The main call is `getOrLoad`.
- **Rate limit.** `RateLimitService` says "this caller may do this N times per period". The main call is `enforce`.
- Both are global Nest modules (`CacheModule`, `RateLimitModule`), so any use case can inject them.
- Both are built and tested. Only the rate limiter is used by a module today. No module uses the cache yet.

## Why we have it

- A read that is slow or hot (every customer message) should not hit Postgres every time.
- Public endpoints (login, sign-up, invite lookup) must be slow for someone who tries a thousand passwords.
- The cache is only a copy. Losing a key must never lose data, so a key can vanish at any time.
- Both services use the **cache** Redis, not the **queue** Redis. The job queue needs a Redis that never evicts keys, or jobs would disappear. A cache wants the opposite: evict old keys when memory is full. So the app has two connections, `REDIS_QUEUE_URL` and `REDIS_CACHE_URL`.
- In local development both URLs point to the same Redis, which runs with `noeviction`. The Helm chart has a separate connection for each (`connections.redis.queue` and `connections.redis.cache` in `deploy/helm/agent-ic/values.yaml`), so production can run an evicting cache Redis next to the queue Redis.

## How it works

```
use case
  |-- cache.getOrLoad(entry, load) --> Redis GET key
  |        hit and valid  -> return it
  |        miss or invalid -> load() -> Redis SET key EX ttl -> return it
  |
  '-- rateLimits.enforce(policy, subject)
           Lua token bucket in Redis
           allowed -> continue
           empty   -> throw RateLimitedError
```

**Cache**

1. `defineCacheEntry({ name, schema, ttlSeconds })` returns a function. You call it with key parts to get one entry. The key is `cache:<name>:<part>:...`.
2. `get` reads the string and parses it with the entry's zod schema.
3. A value that is not JSON, or does not match the schema, counts as a miss (`parseCachedValue` returns `null`). It is then loaded again and overwritten.
4. `set` validates the value with the schema before writing, so a bad value never reaches Redis.
5. `delete` removes the key. Use it when the source changes.

**Rate limit**

1. `defineRateLimitPolicy({ name, capacity, refillPerSecond })` makes a frozen policy.
2. A policy is a bucket of `capacity` tokens that refills at `refillPerSecond`. Each call takes one token (or a `cost` you pass).
3. The bucket lives in one Redis hash per policy and subject: `rate-limit:<policy name>:<subject>`. A Lua script ([token-bucket.constants.ts](../../apps/backend/src/platform/rate-limit/constants/token-bucket.constants.ts)) reads, refills and takes a token in one step, using the Redis clock, so two servers never disagree.
4. `consume` returns a decision (`allowed`, `remaining`, `retryAfterMs`). `enforce` calls it and throws `RateLimitedError` when not allowed.
5. `RateLimitedError` is a limit error with scope `Rate`. It becomes HTTP 429 with the reason `RATE_LIMITED`, and holds `retryAfterSeconds`. The web app already has an EN and UK message for it.

## Example use (hypothetical)

This is not built. There is no agent or flow module yet; `packages/flow` holds only a version constant.

Scenario: a customer writes to a Telegram bot. The backend must load the published flow version of that agent to answer. It does this on every message, and the published version changes only when the owner publishes again.

```
const entry = publishedFlowEntry(agentId)
const flow = await this.cache.getOrLoad(entry, () => this.flows.loadPublished(agentId))
```

- `publishedFlowEntry` would come from `defineCacheEntry`, with the flow zod schema and a TTL of a few minutes.
- On publish, the publish use case would call `cache.delete(publishedFlowEntry(agentId))` after its transaction commits. The TTL covers a missed delete.
- If Redis lost the key, the next message would reload it from Postgres.

## Add one

**A cache entry**

- [ ] A zod schema for the value, in the module's `schemas/`.
- [ ] A TTL as a named constant in `constants/`, not a number in the call.
- [ ] The entry in a `constants/<topic>-cache.constants.ts` file, made with `defineCacheEntry`.
- [ ] Read with `getOrLoad(entry(...parts), load)`. Delete the key when the source changes.
- [ ] Never cache `null`: `getOrLoad` treats a stored `null` as a miss.

**A rate-limit policy**

- [ ] The numbers as named constants, then `defineRateLimitPolicy` in `constants/rate-limit.constants.ts` of your module. Copy [rate-limit.constants.ts](../../apps/backend/src/modules/identity/constants/rate-limit.constants.ts).
- [ ] Pick the subject: the client IP, an email, a user id. A policy per subject kind is clearer than one for all.
- [ ] Inject `RateLimitService` and call `enforce(POLICY, subject)` at the top of the use case, before the transaction.
- [ ] No handler code for the error: `RateLimitedError` is already mapped.

## In the code

- Cache: [platform/cache](../../apps/backend/src/platform/cache/). Key parts: [cache.service.ts](../../apps/backend/src/platform/cache/services/cache.service.ts), [cache.helpers.ts](../../apps/backend/src/platform/cache/helpers/cache.helpers.ts).
- Rate limit: [platform/rate-limit](../../apps/backend/src/platform/rate-limit/). Key parts: [rate-limit.service.ts](../../apps/backend/src/platform/rate-limit/services/rate-limit.service.ts), [rate-limited.error.ts](../../apps/backend/src/platform/rate-limit/errors/rate-limited.error.ts).
- The Redis connection both use: [cache-redis.service.ts](../../apps/backend/src/platform/redis/services/cache-redis.service.ts).
- A real use: the policies in [identity rate-limit.constants.ts](../../apps/backend/src/modules/identity/constants/rate-limit.constants.ts), enforced in [sign-up.use-case.ts](../../apps/backend/src/modules/identity/use-cases/sign-up.use-case.ts) and [login.use-case.ts](../../apps/backend/src/modules/identity/use-cases/login.use-case.ts).
- Specs that show it working: [cache.service.spec.ts](../../apps/backend/src/platform/cache/services/cache.service.spec.ts) (a bad value is a miss, a loader runs once) and [rate-limit.service.spec.ts](../../apps/backend/src/platform/rate-limit/services/rate-limit.service.spec.ts) (blocks after the capacity, refills over time).

## Pitfalls

- **Rate limits are not transactional.** The token is gone even if the use case later fails and rolls back. That is fine for abuse control, but do not use a bucket as a counter for business data.
- **Enforce before slow work.** Put `enforce` before password hashing or database work, so a flood is cheap to refuse.
- **A weak subject is a weak limit.** An IP behind a shared proxy limits many people at once. The login use case limits by email and IP together (5 per minute), and by email alone over a longer period (20 per hour).
- **A cache can lose any key.** Never store the only copy of something. If the cache Redis evicts a rate-limit key, that caller simply gets a full bucket again.
- **Cache keys have no workspace filter.** Row-level security does not protect Redis. Put the workspace id in the key parts for workspace data.
- **Change the entry `name` when the meaning changes.** An old value that no longer fits the schema is a safe miss. An old value that still fits the schema, but means something else, is served until its TTL ends.

Next: [013 The web app](013-web-app.md)
