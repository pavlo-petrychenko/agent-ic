import { useState } from 'react';

export function useUsageNow(): Date {
  const [now] = useState(() => new Date());
  return now;
}
