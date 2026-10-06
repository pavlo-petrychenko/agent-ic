import type { ComponentProps } from 'react';
import type {
  SkeletonBarHeight,
  SkeletonTone,
} from '@/shared/ui/display/Skeleton/Skeleton.constants';

export interface SkeletonLine {
  width: string;
  height: SkeletonBarHeight;
  tone: SkeletonTone;
}

export interface SkeletonProps extends Omit<ComponentProps<'output'>, 'children'> {
  label: string;
  lines?: readonly SkeletonLine[];
  width?: string | null;
}
