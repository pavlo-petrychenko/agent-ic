import { SECONDS_PER_MINUTE } from '@/platform/clock/constants/time.constants';
import { defineRateLimitPolicy } from '@/platform/rate-limit/helpers/rate-limit.helpers';

const API_CHANNEL_MESSAGES_PER_MINUTE = 60;
const API_CHANNEL_CLIENT_MESSAGES_PER_MINUTE = 120;
const API_CHANNEL_WORKSPACE_MESSAGES_PER_MINUTE = 600;

export const API_CHANNEL_MESSAGE_RATE_LIMIT = defineRateLimitPolicy({
  name: 'channels-api-messages',
  capacity: API_CHANNEL_MESSAGES_PER_MINUTE,
  refillPerSecond: API_CHANNEL_MESSAGES_PER_MINUTE / SECONDS_PER_MINUTE,
});

export const API_CHANNEL_CLIENT_MESSAGE_RATE_LIMIT = defineRateLimitPolicy({
  name: 'channels-api-client-messages',
  capacity: API_CHANNEL_CLIENT_MESSAGES_PER_MINUTE,
  refillPerSecond: API_CHANNEL_CLIENT_MESSAGES_PER_MINUTE / SECONDS_PER_MINUTE,
});

export const API_CHANNEL_WORKSPACE_MESSAGE_RATE_LIMIT = defineRateLimitPolicy({
  name: 'channels-api-workspace-messages',
  capacity: API_CHANNEL_WORKSPACE_MESSAGES_PER_MINUTE,
  refillPerSecond: API_CHANNEL_WORKSPACE_MESSAGES_PER_MINUTE / SECONDS_PER_MINUTE,
});
