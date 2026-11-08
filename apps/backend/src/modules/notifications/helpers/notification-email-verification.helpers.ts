import type { ReactElement } from 'react';
import {
  NOTIFICATION_EMAIL_VERIFICATION_COPY,
  NOTIFICATION_EMAIL_VERIFICATION_EMAIL_PLACEHOLDER,
  NOTIFICATION_EMAIL_VERIFICATION_PATH_PREFIX,
  NOTIFICATION_EMAIL_VERIFICATION_PATH_SUFFIX,
  NOTIFICATION_EMAIL_VERIFICATION_QUERY_PARAM,
  NOTIFICATION_EMAIL_VERIFICATION_WORKSPACE_PLACEHOLDER,
} from '@/modules/notifications/constants/notification-email-verification.constants';
import { actionEmailElement } from '@/modules/notifications/helpers/action-email.helpers';
import type { ActionEmailCopy } from '@/modules/notifications/typedefs/email.typedefs';
import type { NotificationEmailVerificationProps } from '@/modules/notifications/typedefs/notification-email-verification.typedefs';

export const notificationEmailVerificationLink = (
  publicUrl: string,
  publicWorkspaceId: string,
  token: string,
): string => {
  const url = new URL(
    `${NOTIFICATION_EMAIL_VERIFICATION_PATH_PREFIX}${encodeURIComponent(publicWorkspaceId)}${NOTIFICATION_EMAIL_VERIFICATION_PATH_SUFFIX}`,
    publicUrl,
  );
  url.searchParams.set(NOTIFICATION_EMAIL_VERIFICATION_QUERY_PARAM, token);
  return url.toString();
};

export const notificationEmailVerificationCopy = (
  props: NotificationEmailVerificationProps,
): ActionEmailCopy => {
  const source = NOTIFICATION_EMAIL_VERIFICATION_COPY[props.locale];
  return {
    ...source,
    subject: source.subject.replaceAll(
      NOTIFICATION_EMAIL_VERIFICATION_WORKSPACE_PLACEHOLDER,
      props.workspaceName,
    ),
    body: source.body
      .replaceAll(NOTIFICATION_EMAIL_VERIFICATION_WORKSPACE_PLACEHOLDER, props.workspaceName)
      .replaceAll(NOTIFICATION_EMAIL_VERIFICATION_EMAIL_PLACEHOLDER, props.email),
  };
};

export const notificationEmailVerificationElement = (
  props: NotificationEmailVerificationProps,
  copy: ActionEmailCopy,
): ReactElement =>
  actionEmailElement(copy, {
    locale: props.locale,
    name: props.name,
    link: props.link,
  });
