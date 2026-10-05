import { useEffect, useRef, useState } from 'react';
import { TOOLTIP_HIDE_DELAY_MS } from '@/shared/ui/overlays/Tooltip/Tooltip.constants';

export function useTooltipHideDelay() {
  const [open, setOpen] = useState(false);
  const escapedRef = useRef(false);
  const timerRef = useRef<number | null>(null);

  const clearTimer = () => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => clearTimer, []);

  const handleOpenChange = (next: boolean) => {
    clearTimer();
    if (next || escapedRef.current) {
      escapedRef.current = false;
      setOpen(next);
      return;
    }
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null;
      setOpen(false);
    }, TOOLTIP_HIDE_DELAY_MS);
  };

  const handleEscapeKeyDown = () => {
    escapedRef.current = true;
    queueMicrotask(() => {
      escapedRef.current = false;
    });
  };

  return { open, handleOpenChange, handleEscapeKeyDown };
}
