export type BrowserNotificationPermission = NotificationPermission | 'unsupported';

export interface BrowserNotificationContent {
  readonly title: string;
  readonly body: string;
  readonly tag: string;
  readonly onClick: () => void;
}

export interface BrowserNotificationAlert {
  readonly id: string;
  readonly conversationId: string;
  readonly customerName: string | null;
  readonly channelKind: string | null;
  readonly reason: string | null;
  readonly createdAt: string;
}

export interface InboxNotificationCardText {
  readonly title: string;
  readonly subtitle: string;
  readonly openLabel: string;
}
