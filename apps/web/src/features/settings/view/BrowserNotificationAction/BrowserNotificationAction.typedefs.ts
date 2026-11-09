export type BrowserNotificationState = 'default' | 'granted' | 'denied' | 'unsupported';

export interface BrowserNotificationActionProps {
  readonly state: BrowserNotificationState;
  readonly onRequest: () => void;
}
