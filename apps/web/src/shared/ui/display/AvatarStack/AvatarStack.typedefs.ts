import type { ComponentProps } from 'react';
import type { AvatarProps } from '@/shared/ui/display/Avatar/Avatar.typedefs';

export interface AvatarStackProps extends Omit<ComponentProps<'div'>, 'children'> {
  avatars: AvatarProps[];
  max?: number;
}
