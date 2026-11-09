export enum CoachmarkPlacement {
  Top = 'top',
  Right = 'right',
  Bottom = 'bottom',
  Left = 'left',
}

export const COACHMARK_CENTERED = 'center';

export const COACHMARK_SPOTLIGHT_PADDING = 6;
export const COACHMARK_TARGET_OFFSET = 12;
export const COACHMARK_VIEWPORT_GUTTER = 16;

export const COACHMARK_FALLBACK_ORDER: Readonly<
  Record<CoachmarkPlacement, readonly CoachmarkPlacement[]>
> = {
  [CoachmarkPlacement.Top]: [
    CoachmarkPlacement.Top,
    CoachmarkPlacement.Bottom,
    CoachmarkPlacement.Right,
    CoachmarkPlacement.Left,
  ],
  [CoachmarkPlacement.Bottom]: [
    CoachmarkPlacement.Bottom,
    CoachmarkPlacement.Top,
    CoachmarkPlacement.Right,
    CoachmarkPlacement.Left,
  ],
  [CoachmarkPlacement.Left]: [
    CoachmarkPlacement.Left,
    CoachmarkPlacement.Right,
    CoachmarkPlacement.Bottom,
    CoachmarkPlacement.Top,
  ],
  [CoachmarkPlacement.Right]: [
    CoachmarkPlacement.Right,
    CoachmarkPlacement.Left,
    CoachmarkPlacement.Bottom,
    CoachmarkPlacement.Top,
  ],
};

export const COACHMARK_REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';
export const COACHMARK_ESCAPE_KEY = 'Escape';
export const COACHMARK_HALF = 2;
export const COACHMARK_SCROLL_ALIGN = 'center';
export const COACHMARK_SCROLL_SMOOTH = 'smooth';
export const COACHMARK_SCROLL_INSTANT = 'auto';
