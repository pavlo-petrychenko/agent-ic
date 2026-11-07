import type { ReactNode } from 'react';

export interface NotificationPreferenceRowModel {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly action: ReactNode;
}

export interface NotificationsCardProps {
  readonly title: string;
  readonly description: string;
  readonly rows: readonly NotificationPreferenceRowModel[];
  readonly footer: string;
  readonly children?: ReactNode;
}
