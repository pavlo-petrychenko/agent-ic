import { useState } from 'react';
import { usagePeriod } from '@/features/settings/logic/helpers/usage.helpers';

export function useUsagePeriod(): { start: Date; end: Date } {
  const [period] = useState(() => usagePeriod(new Date()));
  return period;
}
