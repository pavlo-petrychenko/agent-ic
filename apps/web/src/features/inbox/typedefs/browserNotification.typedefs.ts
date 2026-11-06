export type BrowserNotificationPermission = NotificationPermission | 'unsupported';

export interface BrowserNotificationContent {
  readonly title: string;
  readonly body: string;
  readonly tag: string;
  readonly onClick: () => void;
}
