import { type RefObject, useLayoutEffect, useMemo, useState } from 'react';
import {
  COACHMARK_CENTERED,
  COACHMARK_FALLBACK_ORDER,
  COACHMARK_HALF,
  COACHMARK_TARGET_OFFSET,
  COACHMARK_VIEWPORT_GUTTER,
  CoachmarkPlacement,
} from '@/shared/ui/overlays/Coachmark/Coachmark.constants';
import type {
  CoachmarkPosition,
  CoachmarkPositionInput,
  CoachmarkRect,
  CoachmarkSize,
} from '@/shared/ui/overlays/Coachmark/Coachmark.typedefs';

const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), Math.max(min, max));

export function computeCoachmarkPosition({
  spotlight,
  card,
  viewport,
  placement,
}: CoachmarkPositionInput): CoachmarkPosition {
  const gutter = COACHMARK_VIEWPORT_GUTTER;
  const clampLeft = (value: number) => clamp(value, gutter, viewport.width - gutter - card.width);
  const clampTop = (value: number) => clamp(value, gutter, viewport.height - gutter - card.height);

  if (spotlight === null) {
    return {
      top: clampTop((viewport.height - card.height) / COACHMARK_HALF),
      left: clampLeft((viewport.width - card.width) / COACHMARK_HALF),
      placement: COACHMARK_CENTERED,
    };
  }

  const bottom = spotlight.top + spotlight.height;
  const right = spotlight.left + spotlight.width;
  const space: Readonly<Record<CoachmarkPlacement, number>> = {
    [CoachmarkPlacement.Top]: spotlight.top - COACHMARK_TARGET_OFFSET - gutter,
    [CoachmarkPlacement.Bottom]: viewport.height - gutter - bottom - COACHMARK_TARGET_OFFSET,
    [CoachmarkPlacement.Left]: spotlight.left - COACHMARK_TARGET_OFFSET - gutter,
    [CoachmarkPlacement.Right]: viewport.width - gutter - right - COACHMARK_TARGET_OFFSET,
  };
  const needed: Readonly<Record<CoachmarkPlacement, number>> = {
    [CoachmarkPlacement.Top]: card.height,
    [CoachmarkPlacement.Bottom]: card.height,
    [CoachmarkPlacement.Left]: card.width,
    [CoachmarkPlacement.Right]: card.width,
  };

  const order = COACHMARK_FALLBACK_ORDER[placement];
  const roomiest = order.reduce((best, side) => (space[side] > space[best] ? side : best));
  const side = order.find((candidate) => space[candidate] >= needed[candidate]) ?? roomiest;

  const centeredLeft = spotlight.left + (spotlight.width - card.width) / COACHMARK_HALF;
  const centeredTop = spotlight.top + (spotlight.height - card.height) / COACHMARK_HALF;

  switch (side) {
    case CoachmarkPlacement.Top:
      return {
        top: clampTop(spotlight.top - COACHMARK_TARGET_OFFSET - card.height),
        left: clampLeft(centeredLeft),
        placement: side,
      };
    case CoachmarkPlacement.Bottom:
      return {
        top: clampTop(bottom + COACHMARK_TARGET_OFFSET),
        left: clampLeft(centeredLeft),
        placement: side,
      };
    case CoachmarkPlacement.Left:
      return {
        top: clampTop(centeredTop),
        left: clampLeft(spotlight.left - COACHMARK_TARGET_OFFSET - card.width),
        placement: side,
      };
    case CoachmarkPlacement.Right:
      return {
        top: clampTop(centeredTop),
        left: clampLeft(right + COACHMARK_TARGET_OFFSET),
        placement: side,
      };
  }
}

const readViewport = (): CoachmarkSize => ({
  width: document.documentElement.clientWidth,
  height: document.documentElement.clientHeight,
});

const sameSize = (a: CoachmarkSize, b: CoachmarkSize): boolean =>
  a.width === b.width && a.height === b.height;

export function useCoachmarkPosition(
  cardRef: RefObject<HTMLElement | null>,
  spotlight: CoachmarkRect | null,
  placement: CoachmarkPlacement,
  active: boolean,
): CoachmarkPosition | null {
  const [card, setCard] = useState<CoachmarkSize | null>(null);
  const [viewport, setViewport] = useState<CoachmarkSize>(readViewport);

  useLayoutEffect(() => {
    const element = cardRef.current;
    if (!active || element === null) {
      return;
    }
    const measure = () => {
      const nextCard = { width: element.offsetWidth, height: element.offsetHeight };
      const nextViewport = readViewport();
      setCard((previous) =>
        previous !== null && sameSize(previous, nextCard) ? previous : nextCard,
      );
      setViewport((previous) => (sameSize(previous, nextViewport) ? previous : nextViewport));
    };

    measure();
    window.addEventListener('resize', measure);
    const observer = new ResizeObserver(measure);
    observer.observe(element);

    return () => {
      window.removeEventListener('resize', measure);
      observer.disconnect();
    };
  }, [cardRef, active]);

  return useMemo(
    () =>
      active && card !== null
        ? computeCoachmarkPosition({ spotlight, card, viewport, placement })
        : null,
    [active, card, spotlight, viewport, placement],
  );
}
