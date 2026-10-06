import type { ComponentProps, ReactNode } from 'react';
import type { IconName } from '@/shared/ui/foundations/Icon/Icon.constants';

export interface TriggerNodeProps extends Omit<ComponentProps<'div'>, 'children' | 'title'> {
  title: string;
  subtitle?: string | null;
  icon?: IconName;
  selected?: boolean;
  faded?: boolean;
  disabled?: boolean;
  outPort?: ReactNode | null;
}
