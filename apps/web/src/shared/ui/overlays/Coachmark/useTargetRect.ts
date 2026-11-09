import { useLayoutEffect, useState } from 'react';
import {
  COACHMARK_REDUCED_MOTION_QUERY,
  COACHMARK_SCROLL_ALIGN,
  COACHMARK_SCROLL_INSTANT,
  COACHMARK_SCROLL_SMOOTH,
} from '@/shared/ui/overlays/Coachmark/Coachmark.constants';
import type { CoachmarkRect } from '@/shared/ui/overlays/Coachmark/Coachmark.typedefs';

const readRect = (target: HTMLElement): CoachmarkRect | null => {
  if (!target.isConnected) {
    return null;
  }
  const { top, left, width, height } = target.getBoundingClientRect();
  return { top, left, width, height };
};

const sameRect = (a: CoachmarkRect | null, b: CoachmarkRect | null): boolean =>
  a === b ||
  (a !== null &&
    b !== null &&
    a.top === b.top &&
    a.left === b.left &&
    a.width === b.width &&
    a.height === b.height);

const isFullyVisible = ({ top, left, width, height }: CoachmarkRect): boolean =>
  top >= 0 &&
  left >= 0 &&
  top + height <= document.documentElement.clientHeight &&
  left + width <= document.documentElement.clientWidth;

const prefersReducedMotion = (): boolean =>
  typeof window.matchMedia === 'function' &&
  window.matchMedia(COACHMARK_REDUCED_MOTION_QUERY).matches;

const revealTarget = (target: HTMLElement, rect: CoachmarkRect | null) => {
  if (rect === null || isFullyVisible(rect) || typeof target.scrollIntoView !== 'function') {
    return;
  }
  target.scrollIntoView({
    block: COACHMARK_SCROLL_ALIGN,
    inline: COACHMARK_SCROLL_ALIGN,
    behavior: prefersReducedMotion() ? COACHMARK_SCROLL_INSTANT : COACHMARK_SCROLL_SMOOTH,
  });
};

export function useTargetRect(target: HTMLElement | null, active: boolean): CoachmarkRect | null {
  const [rect, setRect] = useState<CoachmarkRect | null>(null);

  useLayoutEffect(() => {
    if (!active || target === null) {
      return;
    }
    let frame: number | null = null;
    const measure = () => {
      const next = readRect(target);
      setRect((previous) => (sameRect(previous, next) ? previous : next));
    };
    const schedule = () => {
      if (frame !== null) {
        return;
      }
      frame = window.requestAnimationFrame(() => {
        frame = null;
        measure();
      });
    };

    measure();
    revealTarget(target, readRect(target));

    window.addEventListener('resize', schedule);
    window.addEventListener('scroll', schedule, { capture: true, passive: true });
    const observer = new ResizeObserver(schedule);
    observer.observe(target);
    observer.observe(document.documentElement);
    observer.observe(document.body);

    return () => {
      window.removeEventListener('resize', schedule);
      window.removeEventListener('scroll', schedule, { capture: true });
      observer.disconnect();
      if (frame !== null) {
        window.cancelAnimationFrame(frame);
      }
    };
  }, [target, active]);

  return active && target !== null ? rect : null;
}
