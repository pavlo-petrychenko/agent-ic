import { SECONDS_PER_DAY, SECONDS_PER_HOUR } from '@/modules/identity/constants/identity.constants';

export enum IdentityJobName {
  CleanUpAuthRecords = 'identity.clean-up-auth-records',
}

export const AUTH_CLEANUP_INTERVAL_SECONDS = SECONDS_PER_HOUR;
export const SPENT_EMAIL_TOKEN_RETENTION_SECONDS = 7 * SECONDS_PER_DAY;
