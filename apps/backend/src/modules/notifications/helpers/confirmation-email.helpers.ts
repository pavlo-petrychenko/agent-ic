import type { Locale } from '@agent-ic/contracts';
import type { ReactElement } from 'react';
import {
  CONFIRM_EMAIL_LINK_PATH,
  CONFIRMATION_EMAIL_COPY,
} from '@/modules/notifications/constants/confirmation-email.constants';
import {
  actionEmailElement,
  actionLink,
} from '@/modules/notifications/helpers/action-email.helpers';
import type { ActionEmailProps } from '@/modules/notifications/typedefs/email.typedefs';

export const confirmationLink = (publicUrl: string, token: string): string =>
  actionLink(publicUrl, CONFIRM_EMAIL_LINK_PATH, token);

export const confirmationEmailSubject = (locale: Locale): string =>
  CONFIRMATION_EMAIL_COPY[locale].subject;

export const confirmationEmailElement = (props: ActionEmailProps): ReactElement =>
  actionEmailElement(CONFIRMATION_EMAIL_COPY[props.locale], props);
