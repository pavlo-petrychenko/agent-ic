import { useEffect, useState } from 'react';
import { SKELETON_DELAY_MS } from '@/shared/ui/Skeleton/Skeleton.constants';

export function useSkeletonDelay(): boolean {
  const [elapsed, setElapsed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setElapsed(true), SKELETON_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  return elapsed;
}
