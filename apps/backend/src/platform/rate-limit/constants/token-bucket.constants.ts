export const TOKEN_BUCKET_TOKENS_FIELD = 'tokens';
export const TOKEN_BUCKET_UPDATED_FIELD = 'updated';

export const TOKEN_BUCKET_SCRIPT = `
local capacity = tonumber(ARGV[1])
local refill_per_ms = tonumber(ARGV[2])
local cost = tonumber(ARGV[3])
local time = redis.call('TIME')
local now = tonumber(time[1]) * 1000 + math.floor(tonumber(time[2]) / 1000)
local state = redis.call('HMGET', KEYS[1], '${TOKEN_BUCKET_TOKENS_FIELD}', '${TOKEN_BUCKET_UPDATED_FIELD}')
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
redis.call('HSET', KEYS[1], '${TOKEN_BUCKET_TOKENS_FIELD}', tostring(tokens), '${TOKEN_BUCKET_UPDATED_FIELD}', now)
redis.call('PEXPIRE', KEYS[1], math.ceil(capacity / refill_per_ms))
return { allowed, math.floor(tokens), retry_after }
`;
