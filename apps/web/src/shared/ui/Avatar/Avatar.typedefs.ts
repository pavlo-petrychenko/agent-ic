import type { ComponentProps } from 'react';
import type { AvatarSize, AvatarTone } from '@/shared/ui/Avatar/Avatar.constants';
import type { StatusKind } from '@/shared/ui/StatusDot/StatusDot.constants';

export interface AvatarProps extends Omit<ComponentProps<'span'>, 'children'> {
  initials: string;
  size?: AvatarSize;
  tone?: AvatarTone;
  src?: string | null;
  name?: string | null;
  status?: StatusKind | null;
}
