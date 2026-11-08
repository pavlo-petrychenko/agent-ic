import type { ComponentProps } from 'react';

export type NotificationListKind = 'escalation' | 'reminder';

export interface NotificationListItem {
  readonly id: string;
  readonly conversationId: string;
  readonly kind: NotificationListKind;
  readonly waitingMinutes: number;
  readonly minutesAgo: number;
  readonly customerName: string | null;
  readonly channelKind: string | null;
  readonly reason: string | null;
  readonly createdAt: string;
  readonly read: boolean;
  readonly readAt: string | null;
}

export interface NotificationListItemText {
  readonly title: string;
  readonly subtitle: string;
  readonly meta: string;
}

export interface NotificationListRow {
  readonly id: string;
  readonly conversationId: string;
  readonly title: string;
  readonly subtitle: string;
  readonly meta: string;
  readonly read: boolean;
}

export interface NotificationListProps {
  readonly rows: readonly NotificationListRow[];
  readonly loading: boolean;
  readonly markingAll: boolean;
  readonly markAllDisabled: boolean;
  readonly onOpen: (row: NotificationListRow) => void;
  readonly onMarkAll: () => void;
}

export interface NotificationBellButtonProps extends Omit<
  ComponentProps<'button'>,
  'children' | 'aria-label'
> {
  readonly count: number;
  readonly label: string;
}

export interface NotificationBellProps {
  readonly enabled: boolean;
  readonly onOpenConversation: (conversationId: string) => void;
}
