import {
  OPEN_DIALOG_SELECTOR,
  TOUR_ANCHOR_ATTRIBUTE,
  type TourAnchor,
} from '@/features/onboarding/constants/tourAnchor.constants';
import type { TourAnchorAttributes } from '@/features/onboarding/typedefs/tour.typedefs';

export const tourAnchor = (anchor: TourAnchor): TourAnchorAttributes => ({
  [TOUR_ANCHOR_ATTRIBUTE]: anchor,
});

const anchorSelector = (anchor: TourAnchor): string => `[${TOUR_ANCHOR_ATTRIBUTE}="${anchor}"]`;

const isRendered = (element: HTMLElement): boolean => element.getClientRects().length > 0;

export const findTourAnchor = (anchor: TourAnchor): HTMLElement | null => {
  const elements = [...document.querySelectorAll<HTMLElement>(anchorSelector(anchor))];
  return elements.find(isRendered) ?? elements[0] ?? null;
};

export const isDialogOpen = (): boolean => document.querySelector(OPEN_DIALOG_SELECTOR) !== null;
