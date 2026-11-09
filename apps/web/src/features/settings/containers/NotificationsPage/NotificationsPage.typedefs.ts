import type { NotificationPreferencesProps } from '@/features/settings/view/NotificationPreferences';

export interface TelegramLinkCardModel {
  readonly code: string;
  readonly formattedCode: string;
  readonly botUsername: string;
  readonly minutesLeft: number;
}

export interface UseNotificationsPageResult {
  readonly cardTitle: string;
  readonly cardDescription: string;
  readonly cardFooter: string;
  readonly preferences: NotificationPreferencesProps;
  readonly telegramLinked: boolean;
  readonly telegramLinkedOn: string | null;
  readonly telegramLink: TelegramLinkCardModel | null;
  readonly onUnlinkTelegram: () => void;
  readonly onCopyTelegramCode: () => void;
}

export interface NotificationsPageProps {
  readonly workspaceId: string;
}
