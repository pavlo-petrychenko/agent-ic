export interface NotificationSettingsView {
  readonly platformEnabled: boolean;
  readonly emailEnabled: boolean;
  readonly email: string | null;
  readonly telegramEnabled: boolean;
  readonly telegramLinked: boolean;
  readonly telegramUsername: string | null;
  readonly telegramLinkedAt: string | null;
}

export interface UseNotificationSettingsResult {
  readonly settings: NotificationSettingsView;
  readonly loading: boolean;
  readonly refetch: () => Promise<unknown>;
}
