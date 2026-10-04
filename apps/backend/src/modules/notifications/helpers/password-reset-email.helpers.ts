import type { Locale } from '@agent-ic/contracts';
import type { ReactElement } from 'react';
import {
  PASSWORD_RESET_EMAIL_COPY,
  RESET_PASSWORD_LINK_PATH,
} from '@/modules/notifications/constants/password-reset-email.constants';
import {
  actionEmailElement,
  actionLink,
} from '@/modules/notifications/helpers/action-email.helpers';
import type { ActionEmailProps } from '@/modules/notifications/typedefs/email.typedefs';

export const passwordResetLink = (publicUrl: string, token: string): string =>
  actionLink(publicUrl, RESET_PASSWORD_LINK_PATH, token);

export const passwordResetEmailSubject = (locale: Locale): string =>
  PASSWORD_RESET_EMAIL_COPY[locale].subject;

export const passwordResetEmailElement = (props: ActionEmailProps): ReactElement =>
  actionEmailElement(PASSWORD_RESET_EMAIL_COPY[props.locale], props);
