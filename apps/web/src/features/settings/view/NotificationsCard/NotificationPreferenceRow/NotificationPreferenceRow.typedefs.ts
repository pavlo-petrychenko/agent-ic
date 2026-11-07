import type { ReactNode } from 'react';

export interface NotificationPreferenceRowModel {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly action: ReactNode;
}

export interface NotificationPreferenceRowProps {
  readonly row: NotificationPreferenceRowModel;
}
