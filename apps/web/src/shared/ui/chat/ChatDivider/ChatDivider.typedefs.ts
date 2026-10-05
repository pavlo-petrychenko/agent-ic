import type { ComponentProps } from 'react';
import type { IconName } from '@/shared/ui/foundations/Icon/Icon.constants';

export interface ChatDividerProps extends Omit<ComponentProps<'div'>, 'children'> {
  text: string;
  icon?: IconName | null;
}
