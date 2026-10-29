import type { InactivityAction } from '@/features/testing/constants/inactivity.constants';

export interface NextInactivity {
  action: InactivityAction;
  afterMinutes: number;
}
