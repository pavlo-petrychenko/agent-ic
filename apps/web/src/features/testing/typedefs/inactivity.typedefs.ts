import type { InactivityAction } from '@/features/testing/constants/inactivity.constants';

export interface NextFollowUp {
  action: InactivityAction.Trigger;
  afterMinutes: number;
  attempt: number;
}

export interface NextAutoClose {
  action: InactivityAction.AutoClose;
  afterMinutes: number;
}

export type NextInactivity = NextFollowUp | NextAutoClose;
