import { createElement } from 'react';
import type { ReactElement } from 'react';
import {
  ACTION_EMAIL_TOKEN_PARAM,
  NAME_PLACEHOLDER,
} from '@/modules/notifications/constants/action-email.constants';
import {
  EMAIL_BODY_STYLE,
  EMAIL_BUTTON_STYLE,
  EMAIL_CHARSET,
  EMAIL_CONTAINER_STYLE,
  EMAIL_MUTED_STYLE,
} from '@/modules/notifications/constants/email-style.constants';
import type {
  ActionEmailCopy,
  ActionEmailProps,
} from '@/modules/notifications/typedefs/email.typedefs';

export const actionLink = (publicUrl: string, path: string, token: string): string => {
  const url = new URL(path, publicUrl);
  url.searchParams.set(ACTION_EMAIL_TOKEN_PARAM, token);
  return url.toString();
};

export const actionEmailElement = (copy: ActionEmailCopy, props: ActionEmailProps): ReactElement =>
  createElement(
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
