import type { Locale } from '@agent-ic/contracts';
import { createElement } from 'react';
import type { CSSProperties, ReactElement } from 'react';
import { NAME_PLACEHOLDER } from '@/modules/notifications/constants/action-email.constants';
import {
  EMAIL_BODY_STYLE,
  EMAIL_BUTTON_STYLE,
  EMAIL_CHARSET,
  EMAIL_CONTAINER_STYLE,
  EMAIL_MUTED_STYLE,
} from '@/modules/notifications/constants/email-style.constants';
import { ESCALATION_EMAIL_COPY } from '@/modules/notifications/constants/escalation-email.constants';
import type {
  EscalationEmailCopy,
  EscalationEmailProps,
} from '@/modules/notifications/typedefs/email.typedefs';

export const escalationEmailSubject = (locale: Locale): string =>
  ESCALATION_EMAIL_COPY[locale].subject;

const paragraph = (text: string, style?: CSSProperties): ReactElement =>
  createElement('p', style === undefined ? null : { style }, text);

const escalationElement = (copy: EscalationEmailCopy, props: EscalationEmailProps): ReactElement =>
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
        paragraph(copy.greeting.replace(NAME_PLACEHOLDER, props.name)),
        paragraph(copy.reasonLabel, EMAIL_MUTED_STYLE),
        paragraph(props.reason ?? copy.emptyReason),
        paragraph(copy.messageLabel, EMAIL_MUTED_STYLE),
        paragraph(props.lastMessage ?? copy.emptyMessage),
        createElement(
          'p',
          null,
          createElement('a', { href: props.link, style: EMAIL_BUTTON_STYLE }, copy.action),
        ),
        paragraph(copy.footer, EMAIL_MUTED_STYLE),
      ),
    ),
  );

export const escalationEmailElement = (props: EscalationEmailProps): ReactElement =>
  escalationElement(ESCALATION_EMAIL_COPY[props.locale], props);
