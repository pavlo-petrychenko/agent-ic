export const RATE_LIMIT_ROOT = 'rate-limit';
export const RATE_LIMIT_KEY_SEPARATOR = ':';
export const RATE_LIMIT_KEY_COUNT = 1;
export const DEFAULT_RATE_LIMIT_COST = 1;
export const MILLISECONDS_PER_SECOND = 1_000;
export const RATE_LIMITED_MESSAGE = 'Too many requests. Try again later.';
export const RATE_LIMIT_ALLOWED = 1;

export const TOKEN_BUCKET_SCRIPT = `
local capacity = tonumber(ARGV[1])
local refill_per_ms = tonumber(ARGV[2])
local cost = tonumber(ARGV[3])
local time = redis.call('TIME')
local now = tonumber(time[1]) * 1000 + math.floor(tonumber(time[2]) / 1000)
local state = redis.call('HMGET', KEYS[1], 'tokens', 'updated')
local tokens = tonumber(state[1])
local updated = tonumber(state[2])
if tokens == nil or updated == nil then
  tokens = capacity
  updated = now
end
tokens = math.min(capacity, tokens + math.max(0, now - updated) * refill_per_ms)
local allowed = 0
local retry_after = 0
if tokens >= cost then
  tokens = tokens - cost
  allowed = 1
else
  retry_after = math.ceil((cost - tokens) / refill_per_ms)
end
redis.call('HSET', KEYS[1], 'tokens', tostring(tokens), 'updated', now)
redis.call('PEXPIRE', KEYS[1], math.ceil(capacity / refill_per_ms))
return { allowed, math.floor(tokens), retry_after }
`;
