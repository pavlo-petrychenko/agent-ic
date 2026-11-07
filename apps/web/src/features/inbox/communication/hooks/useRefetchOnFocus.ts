import { useEffect } from 'react';

export function useRefetchOnFocus(refetch: () => unknown, enabled = true): void {
  useEffect(() => {
    if (!enabled) {
      return;
    }
    const refresh = () => {
      if (document.visibilityState === 'visible') {
        void refetch();
      }
    };
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [enabled, refetch]);
}
