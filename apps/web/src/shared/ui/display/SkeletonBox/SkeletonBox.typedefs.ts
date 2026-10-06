import type { ComponentProps } from 'react';
import type { SkeletonTone } from '@/shared/ui/display/Skeleton/Skeleton.constants';

export interface SkeletonBoxProps extends Omit<ComponentProps<'span'>, 'children'> {
  width: string;
  height: string;
  tone?: SkeletonTone;
}
