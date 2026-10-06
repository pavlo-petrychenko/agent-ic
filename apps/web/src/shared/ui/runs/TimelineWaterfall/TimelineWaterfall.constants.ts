export enum LabelSide {
  After = 'after',
  Before = 'before',
}

export const TIMELINE_TEXT_ANCHORS: Readonly<Record<LabelSide, 'start' | 'end'>> = {
  [LabelSide.After]: 'start',
  [LabelSide.Before]: 'end',
};

export const TIMELINE_DEFAULT_LABEL_WIDTH = 150;
export const TIMELINE_FALLBACK_TRACK_WIDTH = 210;
export const TIMELINE_TRACK_HEIGHT = 16;
export const TIMELINE_BAR_TOP = 3;
export const TIMELINE_BAR_HEIGHT = 10;
export const TIMELINE_BAR_RADIUS = 3;
export const TIMELINE_MIN_BAR_WIDTH = 2;
export const TIMELINE_LABEL_GAP = 6;
export const TIMELINE_LABEL_CHARACTER_WIDTH = 6.5;
export const TIMELINE_DEPTH_INDENT = 12;
export const TIMELINE_PERCENT = 100;
export const TIMELINE_TOOLTIP_ROW_ID = 'duration';
export const TIMELINE_TEXT_BASELINE = 'central';
