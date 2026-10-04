import type { ComponentProps } from 'react';
import type { SkeletonBarSize } from '@/shared/ui/Skeleton/Skeleton.constants';

export interface SkeletonLine {
  width: string;
  size: SkeletonBarSize;
}

export interface SkeletonProps extends Omit<ComponentProps<'output'>, 'children'> {
  label: string;
  lines?: readonly SkeletonLine[];
  width?: string | null;
}
