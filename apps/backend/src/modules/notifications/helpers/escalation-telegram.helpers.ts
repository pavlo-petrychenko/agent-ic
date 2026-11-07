import { ChannelKind } from '@agent-ic/contracts';
import type { Locale } from '@agent-ic/contracts';
import { ESCALATION_TELEGRAM_COPY } from '@/modules/notifications/constants/escalation-telegram.constants';
import { TELEGRAM_ALERT_LAST_MESSAGE_MAX_LENGTH } from '@/modules/notifications/constants/telegram-alert.constants';
import type {
  EscalationTelegramCopy,
  EscalationTelegramProps,
} from '@/modules/notifications/typedefs/escalation-telegram.typedefs';

const copyOf = (locale: Locale): EscalationTelegramCopy => ESCALATION_TELEGRAM_COPY[locale];

const escapeHtml = (value: string): string =>
  value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

const channelLabelOf = (copy: EscalationTelegramCopy, channel: ChannelKind | null): string => {
  if (channel === ChannelKind.Telegram) {
    return copy.channelTelegram;
  }
  if (channel === ChannelKind.Api) {
    return copy.channelApi;
  }
  return copy.channelFallback;
};

const lastMessageOf = (copy: EscalationTelegramCopy, lastMessage: string | null): string => {
  if (lastMessage === null) {
    return copy.emptyMessage;
  }
  return lastMessage.length <= TELEGRAM_ALERT_LAST_MESSAGE_MAX_LENGTH
    ? lastMessage
    : `${lastMessage.slice(0, TELEGRAM_ALERT_LAST_MESSAGE_MAX_LENGTH)}…`;
};

export const escalationTelegramText = (props: EscalationTelegramProps): string => {
  const copy = copyOf(props.locale);
  const customer = escapeHtml(props.customerName ?? copy.customerFallback);
  const agent = escapeHtml(props.agentName ?? copy.agentFallback);
  const reason = escapeHtml(props.reason ?? copy.emptyReason);
  return [
    `<b>${copy.title}</b>`,
    '',
    `<b>${customer}</b> · ${channelLabelOf(copy, props.channelKind)} · ${agent}`,
    '',
    `<i>“${escapeHtml(lastMessageOf(copy, props.lastMessage))}”</i>`,
    '',
    `<b>${copy.reasonLabel}</b> ${reason}`,
  ].join('\n');
};
