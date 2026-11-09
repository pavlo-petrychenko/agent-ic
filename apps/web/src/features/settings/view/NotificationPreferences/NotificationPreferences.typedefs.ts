import type { BrowserNotificationState } from '@/features/settings/view/BrowserNotificationAction';

export interface TelegramPreferenceModel {
  readonly linked: boolean;
  readonly enabled: boolean;
  readonly waiting: boolean;
  readonly description: string;
}

export interface NotificationPreferencesProps {
  readonly platformEnabled: boolean;
  readonly browserState: BrowserNotificationState;
  readonly browserHint: string;
  readonly emailEnabled: boolean;
  readonly email: string;
  readonly telegram: TelegramPreferenceModel;
  readonly loading: boolean;
  readonly creating: boolean;
  readonly onTogglePlatform: (enabled: boolean) => void;
  readonly onRequestBrowser: () => void;
  readonly onToggleEmail: (enabled: boolean) => void;
  readonly onStartTelegram: () => void;
  readonly onToggleTelegram: (enabled: boolean) => void;
}
