import { SECONDS_PER_MINUTE } from '@/platform/clock/constants/time.constants';
import { defineRateLimitPolicy } from '@/platform/rate-limit/helpers/rate-limit.helpers';

const CHANNEL_CONNECTS_PER_MINUTE = 5;
const CHANNEL_TOKEN_REPLACEMENTS_PER_MINUTE = 5;
const CHANNEL_IDENTITY_REFRESHES_PER_MINUTE = 10;

export const CHANNEL_CONNECT_RATE_LIMIT = defineRateLimitPolicy({
  name: 'channels-connect',
  capacity: CHANNEL_CONNECTS_PER_MINUTE,
  refillPerSecond: CHANNEL_CONNECTS_PER_MINUTE / SECONDS_PER_MINUTE,
});

export const CHANNEL_REPLACE_TOKEN_RATE_LIMIT = defineRateLimitPolicy({
  name: 'channels-replace-token',
  capacity: CHANNEL_TOKEN_REPLACEMENTS_PER_MINUTE,
  refillPerSecond: CHANNEL_TOKEN_REPLACEMENTS_PER_MINUTE / SECONDS_PER_MINUTE,
});

export const CHANNEL_REFRESH_IDENTITY_RATE_LIMIT = defineRateLimitPolicy({
  name: 'channels-refresh-identity',
  capacity: CHANNEL_IDENTITY_REFRESHES_PER_MINUTE,
  refillPerSecond: CHANNEL_IDENTITY_REFRESHES_PER_MINUTE / SECONDS_PER_MINUTE,
});
