import { SkeletonBarHeight, SkeletonTone } from '@/shared/ui/Skeleton/Skeleton.constants';
import type { SkeletonLine } from '@/shared/ui/Skeleton/Skeleton.typedefs';

export const ATTENTION_CARD_LOADING_LINES: readonly SkeletonLine[] = [
  { width: '70%', height: SkeletonBarHeight.Title, tone: SkeletonTone.Strong },
  { width: '45%', height: SkeletonBarHeight.Text, tone: SkeletonTone.Soft },
  { width: '30%', height: SkeletonBarHeight.Text, tone: SkeletonTone.Soft },
];
