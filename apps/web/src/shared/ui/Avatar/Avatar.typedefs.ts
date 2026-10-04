import type { ComponentProps } from 'react';
import type { AvatarSize, AvatarTone } from '@/shared/ui/Avatar/Avatar.constants';

export interface AvatarProps extends Omit<ComponentProps<'span'>, 'children'> {
  initials: string;
  size?: AvatarSize;
  tone?: AvatarTone;
  src?: string | null;
  name?: string | null;
}
