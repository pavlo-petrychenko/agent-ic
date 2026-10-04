import type { SkeletonLine } from '@/shared/ui/Skeleton/Skeleton.typedefs';

export enum SkeletonBarSize {
  Text = 'text',
  Title = 'title',
}

export const SKELETON_DEFAULT_LINES: readonly SkeletonLine[] = [
  { width: '70%', size: SkeletonBarSize.Title },
  { width: '100%', size: SkeletonBarSize.Text },
];

export const SKELETON_FULL_WIDTH = '100%';
