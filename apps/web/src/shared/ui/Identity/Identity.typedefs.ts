import type { ComponentProps, ReactNode } from 'react';
import type { IdentitySize } from '@/shared/ui/Identity/Identity.constants';

export interface IdentityProps extends Omit<ComponentProps<'div'>, 'children'> {
  name: string;
  lead: ReactNode;
  sub?: string | null;
  size?: IdentitySize;
}
