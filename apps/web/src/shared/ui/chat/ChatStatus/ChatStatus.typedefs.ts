import type { ComponentProps } from 'react';
import type { IconName } from '@/shared/ui/foundations/Icon/Icon.constants';

export interface ChatStatusProps extends Omit<ComponentProps<'output'>, 'children'> {
  text: string;
  icon: IconName;
  inProgress?: boolean;
}
