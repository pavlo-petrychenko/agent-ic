import { ChannelKind } from '@agent-ic/contracts';
import type { Locale } from '@agent-ic/contracts';
import {
  ESCALATION_TELEGRAM_COPY,
  ESCALATION_TELEGRAM_MINUTES_PLACEHOLDER,
} from '@/modules/notifications/constants/escalation-telegram.constants';
import { REMINDER_TELEGRAM_COPY } from '@/modules/notifications/constants/reminder-telegram.constants';
import { TELEGRAM_ALERT_LAST_MESSAGE_MAX_LENGTH } from '@/modules/notifications/constants/telegram-alert.constants';
import type {
  EscalationTelegramCopy,
  EscalationTelegramProps,
} from '@/modules/notifications/typedefs/escalation-telegram.typedefs';
import type {
  TelegramInlineKeyboardButton,
  TelegramReplyMarkup,
} from '@/platform/telegram/typedefs/telegram.typedefs';

const escalationCopyOf = (locale: Locale): EscalationTelegramCopy =>
  ESCALATION_TELEGRAM_COPY[locale];

const reminderCopyOf = (locale: Locale): EscalationTelegramCopy => REMINDER_TELEGRAM_COPY[locale];

const fillMinutes = (template: string, minutes: number): string =>
  template.replaceAll(ESCALATION_TELEGRAM_MINUTES_PLACEHOLDER, String(minutes));

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

export interface EscalationTelegramButtons {
  readonly inboxUrl: string;
  readonly takeOverCallbackData: string | null;
}

export const escalationTelegramReplyMarkup = (
  locale: Locale,
  buttons: EscalationTelegramButtons,
): TelegramReplyMarkup => {
  const copy = escalationCopyOf(locale);
  const row: TelegramInlineKeyboardButton[] = [{ text: copy.openInInbox, url: buttons.inboxUrl }];
  if (buttons.takeOverCallbackData !== null) {
    row.push({ text: copy.takeOver, callback_data: buttons.takeOverCallbackData });
  }
  return { inline_keyboard: [row] };
};

const alertTelegramText = (
  copy: EscalationTelegramCopy,
  props: EscalationTelegramProps,
): string => {
  const customer = escapeHtml(props.customerName ?? copy.customerFallback);
  const agent = escapeHtml(props.agentName ?? copy.agentFallback);
  const reason = escapeHtml(props.reason ?? copy.emptyReason);
  const waitingLine = fillMinutes(copy.waitingLine, props.waitingMinutes);
  return [
    `<b>${escapeHtml(fillMinutes(copy.title, props.waitingMinutes))}</b>`,
    '',
    `<b>${customer}</b> · ${channelLabelOf(copy, props.channelKind)} · ${agent}`,
    ...(waitingLine === '' ? [] : ['', waitingLine]),
    '',
    `<i>“${escapeHtml(lastMessageOf(copy, props.lastMessage))}”</i>`,
    '',
    `<b>${copy.reasonLabel}</b> ${reason}`,
  ].join('\n');
};

export const escalationTelegramText = (props: EscalationTelegramProps): string =>
  alertTelegramText(escalationCopyOf(props.locale), props);

export const reminderTelegramText = (props: EscalationTelegramProps): string =>
  alertTelegramText(reminderCopyOf(props.locale), props);
