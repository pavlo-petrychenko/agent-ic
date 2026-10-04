import type { ComponentProps, ReactNode } from 'react';
import type { CalloutTone } from '@/shared/ui/Callout/Callout.constants';
import type { IconName } from '@/shared/ui/Icon/Icon.constants';

export interface CalloutProps extends ComponentProps<'div'> {
  tone?: CalloutTone;
  icon?: IconName | null;
  action?: ReactNode | null;
}
