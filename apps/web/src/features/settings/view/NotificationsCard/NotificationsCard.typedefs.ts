import type { ReactNode } from 'react';

export interface NotificationsCardProps {
  readonly title: string;
  readonly description: string;
  readonly footer: string;
  readonly children: ReactNode;
}
