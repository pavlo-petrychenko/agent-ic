import { NotificationChannel } from '@/modules/notifications/constants/notification.constants';
import type {
  NotificationChannelValue,
  NotificationSettingsView,
  UpdateNotificationChannelInput,
  UpdateNotificationEmailInput,
} from '@/modules/notifications/typedefs/notification-settings.typedefs';
import type { NotificationAlertView } from '@/modules/notifications/typedefs/notification.typedefs';
import type { TelegramNotificationLinkView } from '@/modules/notifications/typedefs/telegram-link.typedefs';
import type {
  NotificationAlert as GraphqlNotificationAlert,
  NotificationSettings as GraphqlNotificationSettings,
  TelegramNotificationLink as GraphqlTelegramNotificationLink,
  UpdateNotificationChannelInput as GraphqlUpdateNotificationChannelInput,
  UpdateNotificationEmailInput as GraphqlUpdateNotificationEmailInput,
} from '@/platform/graphql-server/generated/schema.generated';
import { NotificationChannel as GraphqlNotificationChannel } from '@/platform/graphql-server/generated/schema.generated';

const CHANNEL_FROM_GRAPHQL: Readonly<Record<GraphqlNotificationChannel, NotificationChannelValue>> =
  {
    [GraphqlNotificationChannel.Platform]: NotificationChannel.Platform,
    [GraphqlNotificationChannel.Email]: NotificationChannel.Email,
    [GraphqlNotificationChannel.Telegram]: NotificationChannel.Telegram,
  };

export const toGraphqlNotificationSettings = (
  view: NotificationSettingsView,
): GraphqlNotificationSettings => ({
  platform: { enabled: view.platform.enabled },
  email: {
    enabled: view.email.enabled,
    email: view.email.email,
    verifiedAt: view.email.verifiedAt?.toISOString() ?? null,
  },
  telegram: {
    enabled: view.telegram.enabled,
    linked: view.telegram.linked,
    username: view.telegram.username,
    botUsername: view.telegram.botUsername,
    linkedAt: view.telegram.linkedAt?.toISOString() ?? null,
  },
});

export const toUpdateNotificationChannelInput = (
  input: GraphqlUpdateNotificationChannelInput,
): UpdateNotificationChannelInput => ({
  channel: CHANNEL_FROM_GRAPHQL[input.channel],
  enabled: input.enabled,
});

export const toUpdateNotificationEmailInput = (
  input: GraphqlUpdateNotificationEmailInput,
): UpdateNotificationEmailInput => ({ email: input.email });

export const toGraphqlTelegramNotificationLink = (
  link: TelegramNotificationLinkView,
): GraphqlTelegramNotificationLink => ({
  code: link.code,
  botUsername: link.botUsername,
  expiresAt: link.expiresAt.toISOString(),
});

export const toGraphqlNotificationAlert = (
  alert: NotificationAlertView,
): GraphqlNotificationAlert => ({
  id: alert.id,
  conversationId: alert.conversationId,
  kind: alert.kind,
  waitingMinutes: alert.waitingMinutes,
  customerName: alert.customerName,
  channelKind: alert.channelKind,
  reason: alert.reason,
  createdAt: alert.createdAt.toISOString(),
});
