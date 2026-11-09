import type { ReactElement } from 'react';
import {
  TELEGRAM_TOKEN_REVOKED_CHANNEL_FALLBACK,
  TELEGRAM_TOKEN_REVOKED_EMAIL_CHANNEL_PLACEHOLDER,
  TELEGRAM_TOKEN_REVOKED_EMAIL_COPY,
  TELEGRAM_TOKEN_REVOKED_EMAIL_WORKSPACE_PLACEHOLDER,
} from '@/modules/channels/constants/telegram-token-revoked-email.constants';
import type { TelegramTokenRevokedEmailProps } from '@/modules/channels/typedefs/telegram-token-revoked-email.typedefs';
import { actionEmailElement } from '@/modules/notifications';
import type { ActionEmailCopy } from '@/modules/notifications';

const replaceAudience = (
  value: string,
  props: TelegramTokenRevokedEmailProps,
  channelName: string,
): string =>
  value
    .replaceAll(TELEGRAM_TOKEN_REVOKED_EMAIL_WORKSPACE_PLACEHOLDER, props.workspaceName)
    .replaceAll(TELEGRAM_TOKEN_REVOKED_EMAIL_CHANNEL_PLACEHOLDER, channelName);

export const telegramTokenRevokedEmailLink = (
  publicUrl: string,
  publicWorkspaceId: string,
  publicChannelId: string,
): string =>
  new URL(
    `/w/${encodeURIComponent(publicWorkspaceId)}/channels/telegram/${encodeURIComponent(publicChannelId)}`,
    publicUrl,
  ).toString();

export const telegramTokenRevokedEmailCopy = (
  props: TelegramTokenRevokedEmailProps,
): ActionEmailCopy => {
  const source = TELEGRAM_TOKEN_REVOKED_EMAIL_COPY[props.recipient.locale];
  const channelName =
    props.channelName ?? TELEGRAM_TOKEN_REVOKED_CHANNEL_FALLBACK[props.recipient.locale];
  return {
    ...source,
    subject: replaceAudience(source.subject, props, channelName),
    body: replaceAudience(source.body, props, channelName),
    ignore: replaceAudience(source.ignore, props, channelName),
  };
};

export const telegramTokenRevokedEmailElement = (
  props: TelegramTokenRevokedEmailProps,
  copy: ActionEmailCopy,
): ReactElement =>
  actionEmailElement(copy, {
    locale: props.recipient.locale,
    name: props.recipient.name,
    link: props.link,
  });
