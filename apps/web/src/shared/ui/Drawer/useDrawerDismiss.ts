import { type RefObject, useEffect } from 'react';
import { DRAWER_ESCAPE_KEY } from '@/shared/ui/Drawer/Drawer.constants';

interface UseDrawerDismissOptions {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  elementRef: RefObject<HTMLElement | null>;
}

export function useDrawerDismiss({ open, onOpenChange, elementRef }: UseDrawerDismissOptions) {
  useEffect(() => {
    if (!open) {
      return;
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === DRAWER_ESCAPE_KEY && !event.defaultPrevented) {
        onOpenChange(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onOpenChange]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const opener = document.activeElement;
    const element = elementRef.current;
    element?.focus({ preventScroll: true });
    return () => {
      const active = document.activeElement;
      const focusIsLost = active === document.body || element?.contains(active) === true;
      if (opener instanceof HTMLElement && opener.isConnected && focusIsLost) {
        opener.focus();
      }
    };
  }, [open, elementRef]);
}
