import type { ComponentProps } from 'react';

export interface HelpTriggerProps extends Omit<ComponentProps<'button'>, 'children'> {
  label: string;
  compact: boolean;
}
