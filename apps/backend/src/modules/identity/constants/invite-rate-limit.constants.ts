import { SECONDS_PER_HOUR } from '@/modules/identity/constants/identity.constants';
import { defineRateLimitPolicy } from '@/platform/rate-limit/helpers/rate-limit.helpers';

const INVITE_LOOKUPS_PER_HOUR = 20;

export const INVITE_LOOKUP_RATE_LIMIT = defineRateLimitPolicy({
  name: 'identity-invite-lookup',
  capacity: INVITE_LOOKUPS_PER_HOUR,
  refillPerSecond: INVITE_LOOKUPS_PER_HOUR / SECONDS_PER_HOUR,
});
