import type { SkeletonLine } from '@/shared/ui/display/Skeleton/Skeleton.typedefs';

export enum SkeletonBarHeight {
  Hairline = 7,
  Text = 8,
  Compact = 9,
  Label = 10,
  Title = 12,
  Heading = 14,
}

export enum SkeletonTone {
  Strong = 'strong',
  Soft = 'soft',
}

export const SKELETON_DEFAULT_LINES: readonly SkeletonLine[] = [
  { width: '70%', height: SkeletonBarHeight.Title, tone: SkeletonTone.Strong },
  { width: '100%', height: SkeletonBarHeight.Text, tone: SkeletonTone.Soft },
];

export const SKELETON_FULL_WIDTH = '100%';
export const SKELETON_DELAY_MS = 300;
