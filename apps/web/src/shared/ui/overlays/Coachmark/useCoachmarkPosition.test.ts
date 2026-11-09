import { describe, expect, it } from 'vitest';
import {
  COACHMARK_CENTERED,
  COACHMARK_TARGET_OFFSET,
  COACHMARK_VIEWPORT_GUTTER,
  CoachmarkPlacement,
} from '@/shared/ui/overlays/Coachmark/Coachmark.constants';
import { computeCoachmarkPosition } from '@/shared/ui/overlays/Coachmark/useCoachmarkPosition';

const VIEWPORT = { width: 1000, height: 800 };
const CARD = { width: 300, height: 200 };
const SPOTLIGHT = { top: 300, left: 400, width: 100, height: 50 };

const place = (
  placement: CoachmarkPlacement,
  spotlight = SPOTLIGHT,
  viewport = VIEWPORT,
  card = CARD,
) => computeCoachmarkPosition({ spotlight, card, viewport, placement });

describe('computeCoachmarkPosition', () => {
  it('centres the card without a spotlight', () => {
    expect(
      computeCoachmarkPosition({
        spotlight: null,
        card: CARD,
        viewport: VIEWPORT,
        placement: CoachmarkPlacement.Bottom,
      }),
    ).toEqual({ top: 300, left: 350, placement: COACHMARK_CENTERED });
  });

  it('places the card on each preferred side, centred on the spotlight', () => {
    expect(place(CoachmarkPlacement.Bottom)).toEqual({
      top: 350 + COACHMARK_TARGET_OFFSET,
      left: 300,
      placement: CoachmarkPlacement.Bottom,
    });
    expect(place(CoachmarkPlacement.Top)).toEqual({
      top: 300 - COACHMARK_TARGET_OFFSET - CARD.height,
      left: 300,
      placement: CoachmarkPlacement.Top,
    });
    expect(place(CoachmarkPlacement.Right)).toEqual({
      top: 225,
      left: 500 + COACHMARK_TARGET_OFFSET,
      placement: CoachmarkPlacement.Right,
    });
    expect(place(CoachmarkPlacement.Left)).toEqual({
      top: 225,
      left: 400 - COACHMARK_TARGET_OFFSET - CARD.width,
      placement: CoachmarkPlacement.Left,
    });
  });

  it('flips to the opposite side when the preferred side has no room', () => {
    const nearBottom = { ...SPOTLIGHT, top: 700 };

    expect(place(CoachmarkPlacement.Bottom, nearBottom).placement).toBe(CoachmarkPlacement.Top);
  });

  it('tries the perpendicular sides when both vertical sides are too small', () => {
    const shortViewport = { width: 1000, height: 260 };
    const spotlight = { top: 100, left: 400, width: 100, height: 50 };

    expect(place(CoachmarkPlacement.Bottom, spotlight, shortViewport).placement).toBe(
      CoachmarkPlacement.Right,
    );
  });

  it('keeps the card inside the viewport gutter', () => {
    const atRightEdge = { top: 300, left: 950, width: 40, height: 40 };
    const atLeftEdge = { top: 300, left: 0, width: 40, height: 40 };

    const right = place(CoachmarkPlacement.Bottom, atRightEdge);
    const left = place(CoachmarkPlacement.Bottom, atLeftEdge);

    expect(right.left + CARD.width).toBeLessThanOrEqual(VIEWPORT.width - COACHMARK_VIEWPORT_GUTTER);
    expect(left.left).toBe(COACHMARK_VIEWPORT_GUTTER);
  });

  it('falls back to the roomiest side, clamped, when nothing fits', () => {
    const tiny = { width: 320, height: 240 };
    const spotlight = { top: 60, left: 60, width: 200, height: 120 };

    const result = place(CoachmarkPlacement.Bottom, spotlight, tiny);

    expect(result.top).toBeGreaterThanOrEqual(COACHMARK_VIEWPORT_GUTTER);
    expect(result.top + CARD.height).toBeLessThanOrEqual(tiny.height - COACHMARK_VIEWPORT_GUTTER);
    expect(result.left).toBeGreaterThanOrEqual(COACHMARK_VIEWPORT_GUTTER);
  });

  it('fits a full-width card on a narrow viewport', () => {
    const narrow = { width: 360, height: 640 };
    const card = { width: 328, height: 220 };
    const spotlight = { top: 100, left: 150, width: 60, height: 40 };

    const result = place(CoachmarkPlacement.Bottom, spotlight, narrow, card);

    expect(result.left).toBe(COACHMARK_VIEWPORT_GUTTER);
    expect(result.placement).toBe(CoachmarkPlacement.Bottom);
  });
});
