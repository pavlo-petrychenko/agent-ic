import { z } from 'zod';
import { FIRST_INACTIVITY_ATTEMPT } from '@/modules/runs/constants/inactivity.constants';

export const inactivityTriggerInputSchema = z.object({
  attempt: z.int().min(FIRST_INACTIVITY_ATTEMPT),
  silentMinutes: z.int().nonnegative(),
});
