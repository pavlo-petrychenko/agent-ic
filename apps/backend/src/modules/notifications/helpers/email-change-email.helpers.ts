import type { Locale } from '@agent-ic/contracts';
import type { ReactElement } from 'react';
import {
  EMAIL_CHANGE_EMAIL_COPY,
  EMAIL_CHANGE_LINK_PATH,
} from '@/modules/notifications/constants/email-change-email.constants';
import {
  actionEmailElement,
  actionLink,
} from '@/modules/notifications/helpers/action-email.helpers';
import type { ActionEmailProps } from '@/modules/notifications/typedefs/email.typedefs';

export const emailChangeLink = (publicUrl: string, token: string): string =>
  actionLink(publicUrl, EMAIL_CHANGE_LINK_PATH, token);

export const emailChangeEmailSubject = (locale: Locale): string =>
  EMAIL_CHANGE_EMAIL_COPY[locale].subject;

export const emailChangeEmailElement = (props: ActionEmailProps): ReactElement =>
  actionEmailElement(EMAIL_CHANGE_EMAIL_COPY[props.locale], props);
