export enum FlowThumbnailSize {
  Sm = 'sm',
  Md = 'md',
}

export interface FlowThumbnailMetrics {
  scale: number;
  nodeWidth: number;
  nodeHeight: number;
  nodeRadius: number;
  badgeSize: number;
  badgeInset: number;
  badgeRadius: number;
  iconSize: number;
  iconStrokeWidth: number;
  fontSize: number;
  labelGap: number;
  labelPadEnd: number;
  padding: number;
  cornerRadius: number;
  ringGap: number;
  showLabels: boolean;
}

export const FLOW_THUMBNAIL_METRICS: Readonly<Record<FlowThumbnailSize, FlowThumbnailMetrics>> = {
  [FlowThumbnailSize.Sm]: {
    scale: 0.26,
    nodeWidth: 26,
    nodeHeight: 26,
    nodeRadius: 8,
    badgeSize: 26,
    badgeInset: 0,
    badgeRadius: 8,
    iconSize: 14,
    iconStrokeWidth: 1.8,
    fontSize: 0,
    labelGap: 0,
    labelPadEnd: 0,
    padding: 8,
    cornerRadius: 6,
    ringGap: 3,
    showLabels: false,
  },
  [FlowThumbnailSize.Md]: {
    scale: 0.56,
    nodeWidth: 144,
    nodeHeight: 32,
    nodeRadius: 9,
    badgeSize: 22,
    badgeInset: 5,
    badgeRadius: 6,
    iconSize: 13,
    iconStrokeWidth: 1.8,
    fontSize: 11,
    labelGap: 7,
    labelPadEnd: 8,
    padding: 10,
    cornerRadius: 9,
    ringGap: 3,
    showLabels: true,
  },
};

export const FLOW_THUMBNAIL_CHAR_WIDTH_RATIO = 0.52;
export const FLOW_THUMBNAIL_ELLIPSIS = '…';
export const FLOW_THUMBNAIL_ARROW_SIZE = 6;
export const FLOW_THUMBNAIL_ARROW_PATH = 'M0,0 L6,3 L0,6 Z';
export const FLOW_THUMBNAIL_MIN_STEP = 14;
export const FLOW_THUMBNAIL_MIN_CURVE = 24;
