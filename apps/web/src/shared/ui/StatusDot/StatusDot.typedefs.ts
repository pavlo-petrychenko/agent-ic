import type { ComponentProps } from 'react';
import type { StatusKind } from '@/shared/ui/StatusDot/StatusDot.constants';

export interface StatusDotProps extends Omit<ComponentProps<'span'>, 'children'> {
  kind: StatusKind;
  label?: string | null;
}
