import type { Locale } from '@agent-ic/contracts';
import { createElement } from 'react';
import type { ReactElement } from 'react';
import {
  CONFIRM_EMAIL_LINK_PATH,
  CONFIRM_EMAIL_TOKEN_PARAM,
  CONFIRMATION_EMAIL_COPY,
  NAME_PLACEHOLDER,
} from '@/modules/notifications/constants/confirmation-email.constants';
import {
  EMAIL_BODY_STYLE,
  EMAIL_BUTTON_STYLE,
  EMAIL_CHARSET,
  EMAIL_CONTAINER_STYLE,
  EMAIL_MUTED_STYLE,
} from '@/modules/notifications/constants/email-style.constants';
import type { ConfirmationEmailProps } from '@/modules/notifications/typedefs/email.typedefs';

export const confirmationLink = (publicUrl: string, token: string): string => {
  const url = new URL(CONFIRM_EMAIL_LINK_PATH, publicUrl);
  url.searchParams.set(CONFIRM_EMAIL_TOKEN_PARAM, token);
  return url.toString();
};

export const confirmationEmailSubject = (locale: Locale): string =>
  CONFIRMATION_EMAIL_COPY[locale].subject;

export const confirmationEmailElement = (props: ConfirmationEmailProps): ReactElement => {
  const copy = CONFIRMATION_EMAIL_COPY[props.locale];
  return createElement(
    'html',
    { lang: props.locale },
    createElement('head', null, createElement('meta', { charSet: EMAIL_CHARSET })),
    createElement(
      'body',
      { style: EMAIL_BODY_STYLE },
      createElement(
        'div',
        { style: EMAIL_CONTAINER_STYLE },
        createElement('p', null, copy.greeting.replace(NAME_PLACEHOLDER, props.name)),
        createElement('p', null, copy.body),
        createElement(
          'p',
          null,
          createElement('a', { href: props.link, style: EMAIL_BUTTON_STYLE }, copy.action),
        ),
        createElement('p', null, copy.expiry),
        createElement('p', { style: EMAIL_MUTED_STYLE }, copy.ignore),
      ),
    ),
  );
};
