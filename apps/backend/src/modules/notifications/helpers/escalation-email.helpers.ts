import { ChannelKind } from '@agent-ic/contracts';
import type { Locale } from '@agent-ic/contracts';
import { createElement } from 'react';
import type { CSSProperties, ReactElement, ReactNode } from 'react';
import {
  EMAIL_BODY_STYLE,
  EMAIL_CHARSET,
  ESCALATION_EMAIL_BUTTON_STYLE,
  ESCALATION_EMAIL_CARD_STYLE,
  ESCALATION_EMAIL_DIVIDER_STYLE,
  ESCALATION_EMAIL_FOOTER_STYLE,
  ESCALATION_EMAIL_META_STYLE,
  ESCALATION_EMAIL_QUOTE_STYLE,
  ESCALATION_EMAIL_TITLE_STYLE,
} from '@/modules/notifications/constants/email-style.constants';
import {
  ESCALATION_AGENT_PLACEHOLDER,
  ESCALATION_CHANNEL_PLACEHOLDER,
  ESCALATION_CUSTOMER_PLACEHOLDER,
  ESCALATION_EMAIL_COPY,
  ESCALATION_WORKSPACE_PLACEHOLDER,
} from '@/modules/notifications/constants/escalation-email.constants';
import type {
  EscalationEmailCopy,
  EscalationEmailProps,
} from '@/modules/notifications/typedefs/email.typedefs';

const fill = (template: string, values: Readonly<Record<string, string>>): string =>
  Object.entries(values).reduce(
    (text, [placeholder, value]) => text.replaceAll(placeholder, value),
    template,
  );

const copyOf = (locale: Locale): EscalationEmailCopy => ESCALATION_EMAIL_COPY[locale];

const subjectOf = (copy: EscalationEmailCopy, customerName: string | null): string =>
  fill(copy.subject, {
    [ESCALATION_CUSTOMER_PLACEHOLDER]: customerName ?? copy.customerFallback,
  });

const channelLabelOf = (copy: EscalationEmailCopy, channel: ChannelKind | null): string => {
  if (channel === ChannelKind.Telegram) {
    return copy.channelTelegram;
  }
  if (channel === ChannelKind.Api) {
    return copy.channelApi;
  }
  return copy.channelFallback;
};

export const escalationEmailSubject = (locale: Locale, customerName: string | null): string =>
  subjectOf(copyOf(locale), customerName);

const paragraph = (children: ReactNode, style?: CSSProperties): ReactElement =>
  createElement('p', style === undefined ? null : { style }, children);

const escalationElement = (
  copy: EscalationEmailCopy,
  props: EscalationEmailProps,
): ReactElement => {
  const title = subjectOf(copy, props.customerName);
  const agentName = props.agentName ?? copy.agentFallback;
  const body = fill(copy.body, {
    [ESCALATION_AGENT_PLACEHOLDER]: agentName,
    [ESCALATION_CHANNEL_PLACEHOLDER]: channelLabelOf(copy, props.channelKind),
  });
  const footer = fill(copy.footer, {
    [ESCALATION_WORKSPACE_PLACEHOLDER]: props.workspaceName ?? copy.workspaceFallback,
  });
  return createElement(
    'html',
    { lang: props.locale },
    createElement('head', null, createElement('meta', { charSet: EMAIL_CHARSET })),
    createElement(
      'body',
      { style: EMAIL_BODY_STYLE },
      createElement(
        'div',
        { style: ESCALATION_EMAIL_CARD_STYLE },
        paragraph(title, ESCALATION_EMAIL_TITLE_STYLE),
        paragraph(
          `${agentName} · ${copy.metaTo} ${props.recipientEmail} · ${props.time}`,
          ESCALATION_EMAIL_META_STYLE,
        ),
        createElement('hr', { style: ESCALATION_EMAIL_DIVIDER_STYLE }),
        paragraph(body),
        paragraph(`${copy.reasonLabel} ${props.reason ?? copy.emptyReason}`),
        createElement(
          'blockquote',
          { style: ESCALATION_EMAIL_QUOTE_STYLE },
          `“${props.lastMessage ?? copy.emptyMessage}”`,
        ),
        createElement(
          'p',
          null,
          createElement(
            'a',
            { href: props.link, style: ESCALATION_EMAIL_BUTTON_STYLE },
            copy.action,
          ),
        ),
        paragraph(footer, ESCALATION_EMAIL_FOOTER_STYLE),
      ),
    ),
  );
};

export const escalationEmailElement = (props: EscalationEmailProps): ReactElement =>
  escalationElement(copyOf(props.locale), props);
