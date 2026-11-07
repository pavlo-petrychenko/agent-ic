import {
  TELEGRAM_ALERTS_LINK_ALREADY,
  TELEGRAM_ALERTS_LINK_CONFIRMED,
  TELEGRAM_ALERTS_LINK_EXPIRED,
  TELEGRAM_ALERTS_LINK_INSTRUCTIONS,
  TELEGRAM_ALERTS_LINK_INVALID,
} from '@/modules/notifications/constants/telegram-alert.constants';
import { TelegramLinkStatus } from '@/modules/notifications/typedefs/telegram-link.typedefs';

const TELEGRAM_LINK_CODE_PATTERN = /^\d{6}$/;
const START_COMMAND = '/start';

const normalizeCode = (value: string): string => value.replace(/\s+/g, '');

export const telegramLinkCodeFromMessage = (text: string): string | null => {
  const trimmed = text.trim();
  const payload = trimmed.startsWith(START_COMMAND)
    ? trimmed.slice(START_COMMAND.length).trim()
    : trimmed;
  const code = normalizeCode(payload);
  return TELEGRAM_LINK_CODE_PATTERN.test(code) ? code : null;
};

export const telegramLinkReply = (status: TelegramLinkStatus): string => {
  switch (status) {
    case TelegramLinkStatus.Linked:
      return TELEGRAM_ALERTS_LINK_CONFIRMED;
    case TelegramLinkStatus.Expired:
      return TELEGRAM_ALERTS_LINK_EXPIRED;
    case TelegramLinkStatus.AlreadyLinked:
      return TELEGRAM_ALERTS_LINK_ALREADY;
    case TelegramLinkStatus.Invalid:
      return TELEGRAM_ALERTS_LINK_INVALID;
    case TelegramLinkStatus.NotConfigured:
      return TELEGRAM_ALERTS_LINK_INSTRUCTIONS;
  }
};
