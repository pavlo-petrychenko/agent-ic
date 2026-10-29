import { SECONDS_PER_MINUTE } from '@/platform/clock/constants/time.constants';

export enum ConversationJobName {
  CloseInactive = 'conversations.close-inactive',
}

export const AUTO_CLOSE_SWEEP_INTERVAL_SECONDS = 5 * SECONDS_PER_MINUTE;
export const AUTO_CLOSE_BATCH_SIZE = 100;
