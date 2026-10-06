import { BadgeTone } from '@/shared/ui/display/Badge/Badge.constants';
import { SkeletonBarHeight, SkeletonTone } from '@/shared/ui/display/Skeleton/Skeleton.constants';
import type { SkeletonLine } from '@/shared/ui/display/Skeleton/Skeleton.typedefs';

export enum StatTrendTone {
  Ok = 'ok',
  Err = 'err',
}

export const STAT_TREND_BADGE_TONES: Readonly<Record<StatTrendTone, BadgeTone>> = {
  [StatTrendTone.Ok]: BadgeTone.Ok,
  [StatTrendTone.Err]: BadgeTone.Err,
};

export const STAT_LOADING_LINES: readonly SkeletonLine[] = [
  { width: '40%', height: SkeletonBarHeight.Heading, tone: SkeletonTone.Strong },
];
