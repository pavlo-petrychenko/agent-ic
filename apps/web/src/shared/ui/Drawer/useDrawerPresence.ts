import { type AnimationEvent, type RefObject, useLayoutEffect, useState } from 'react';
import { DRAWER_NO_ANIMATION_NAMES } from '@/shared/ui/Drawer/Drawer.constants';

export function useDrawerPresence(open: boolean, elementRef: RefObject<HTMLElement | null>) {
  const [mounted, setMounted] = useState(open);

  if (open && !mounted) {
    setMounted(true);
  }

  useLayoutEffect(() => {
    if (open || !mounted) {
      return;
    }
    const element = elementRef.current;
    const animationName = element === null ? '' : window.getComputedStyle(element).animationName;
    if (DRAWER_NO_ANIMATION_NAMES.includes(animationName)) {
      setMounted(false);
    }
  }, [open, mounted, elementRef]);

  const handleAnimationEnd = (event: AnimationEvent<HTMLElement>) => {
    if (!open && event.target === event.currentTarget) {
      setMounted(false);
    }
  };

  return { mounted, handleAnimationEnd };
}
