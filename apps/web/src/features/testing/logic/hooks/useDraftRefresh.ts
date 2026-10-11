import { useEffect, useRef } from 'react';

export function useDraftRefresh(
  newestRunId: string | null,
  tracking: boolean,
  refresh: () => void,
): void {
  const seen = useRef<{ runId: string | null } | null>(null);

  useEffect(() => {
    if (!tracking) {
      return;
    }
    const previous = seen.current;
    seen.current = { runId: newestRunId };
    if (previous !== null && newestRunId !== null && previous.runId !== newestRunId) {
      refresh();
    }
  }, [newestRunId, tracking, refresh]);
}
