import type { ReactNode } from 'react';
import type { EmptyStateTone } from '@/shared/ui/display/EmptyState/EmptyState.constants';
import type { IconName } from '@/shared/ui/foundations/Icon/Icon.constants';

export interface EmptyStateProps {
  icon: IconName;
  title: string;
  description?: ReactNode | null;
  tone?: EmptyStateTone;
  actions?: ReactNode | null;
}
