import type { TelegramNotificationLink } from '@/features/settings/typedefs/telegramLink.typedefs';
import type { BrowserNotificationState } from '@/features/settings/view/BrowserNotificationAction';
import type { NotificationEmailFieldProps } from '@/features/settings/view/NotificationEmailField';
import type { NotificationPreferencesProps } from '@/features/settings/view/NotificationPreferences';

export interface TelegramLinkCardModel {
  readonly code: string;
  readonly formattedCode: string;
  readonly botUsername: string;
  readonly minutesLeft: number;
}

export interface UseNotificationChannelsResult {
  readonly platformEnabled: boolean;
  readonly emailEnabled: boolean;
  readonly browserState: BrowserNotificationState;
  readonly browserHint: string;
  readonly onTogglePlatform: (enabled: boolean) => void;
  readonly onRequestBrowser: () => void;
  readonly onToggleEmail: (enabled: boolean) => void;
  readonly onToggleTelegram: (enabled: boolean) => void;
}

export interface UseTelegramNotificationLinkResult {
  readonly pending: TelegramNotificationLink | null;
  readonly creating: boolean;
  readonly start: () => Promise<void>;
  readonly clear: () => void;
  readonly unlink: () => Promise<void>;
  readonly copy: () => Promise<void>;
}

export interface UseNotificationsPageResult {
  readonly cardTitle: string;
  readonly cardDescription: string;
  readonly cardFooter: string;
  readonly preferences: NotificationPreferencesProps;
  readonly emailField: NotificationEmailFieldProps;
  readonly telegramLinked: boolean;
  readonly telegramLinkedOn: string | null;
  readonly telegramLink: TelegramLinkCardModel | null;
  readonly onUnlinkTelegram: () => void;
  readonly onCopyTelegramCode: () => void;
}

export interface NotificationsPageProps {
  readonly workspaceId: string;
  readonly verificationToken: string | null;
  readonly onVerificationHandled: () => void;
}
