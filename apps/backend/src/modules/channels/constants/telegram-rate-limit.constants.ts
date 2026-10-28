import { defineRateLimitPolicy } from '@/platform/rate-limit/helpers/rate-limit.helpers';

const TELEGRAM_MESSAGES_PER_SECOND_PER_BOT = 30;
const TELEGRAM_MESSAGES_PER_SECOND_PER_CHAT = 1;

export const TELEGRAM_BOT_RATE_LIMIT = defineRateLimitPolicy({
  name: 'channels-telegram-bot',
  capacity: TELEGRAM_MESSAGES_PER_SECOND_PER_BOT,
  refillPerSecond: TELEGRAM_MESSAGES_PER_SECOND_PER_BOT,
});

export const TELEGRAM_CHAT_RATE_LIMIT = defineRateLimitPolicy({
  name: 'channels-telegram-chat',
  capacity: TELEGRAM_MESSAGES_PER_SECOND_PER_CHAT,
  refillPerSecond: TELEGRAM_MESSAGES_PER_SECOND_PER_CHAT,
});

export const TELEGRAM_RATE_LIMIT_SUBJECT_SEPARATOR = ':';
