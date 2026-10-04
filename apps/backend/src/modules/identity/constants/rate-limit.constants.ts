import {
  SECONDS_PER_HOUR,
  SECONDS_PER_MINUTE,
} from '@/modules/identity/constants/identity.constants';
import { defineRateLimitPolicy } from '@/platform/rate-limit/helpers/rate-limit.helpers';

const LOGIN_ATTEMPTS_PER_MINUTE = 5;
const ACCOUNT_LOGIN_ATTEMPTS_PER_HOUR = 20;
const SIGN_UPS_PER_HOUR = 5;
const CONFIRMATION_RESENDS_PER_HOUR = 3;

export const LOGIN_RATE_LIMIT = defineRateLimitPolicy({
  name: 'identity-login',
  capacity: LOGIN_ATTEMPTS_PER_MINUTE,
  refillPerSecond: LOGIN_ATTEMPTS_PER_MINUTE / SECONDS_PER_MINUTE,
});

export const ACCOUNT_LOGIN_RATE_LIMIT = defineRateLimitPolicy({
  name: 'identity-account-login',
  capacity: ACCOUNT_LOGIN_ATTEMPTS_PER_HOUR,
  refillPerSecond: ACCOUNT_LOGIN_ATTEMPTS_PER_HOUR / SECONDS_PER_HOUR,
});

export const SIGN_UP_RATE_LIMIT = defineRateLimitPolicy({
  name: 'identity-sign-up',
  capacity: SIGN_UPS_PER_HOUR,
  refillPerSecond: SIGN_UPS_PER_HOUR / SECONDS_PER_HOUR,
});

export const RESEND_CONFIRMATION_RATE_LIMIT = defineRateLimitPolicy({
  name: 'identity-resend-confirmation',
  capacity: CONFIRMATION_RESENDS_PER_HOUR,
  refillPerSecond: CONFIRMATION_RESENDS_PER_HOUR / SECONDS_PER_HOUR,
});

export const UNKNOWN_CLIENT_IP = 'unknown';
export const RATE_LIMIT_SUBJECT_SEPARATOR = '|';
