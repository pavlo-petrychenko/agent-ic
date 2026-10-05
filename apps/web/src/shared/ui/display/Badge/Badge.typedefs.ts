import type { ComponentProps } from 'react';
import type { BadgeTone } from '@/shared/ui/display/Badge/Badge.constants';

export interface BadgeProps extends ComponentProps<'span'> {
  tone?: BadgeTone;
  dot?: boolean;
  mono?: boolean;
}
