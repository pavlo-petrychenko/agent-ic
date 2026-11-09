import { Locale } from '@agent-ic/contracts';
import { NAME_PLACEHOLDER } from '@/modules/notifications';
import type { ActionEmailCopy } from '@/modules/notifications';

export const TELEGRAM_TOKEN_REVOKED_EMAIL_WORKSPACE_PLACEHOLDER = '{workspace}';
export const TELEGRAM_TOKEN_REVOKED_EMAIL_CHANNEL_PLACEHOLDER = '{channel}';

export const TELEGRAM_TOKEN_REVOKED_CHANNEL_FALLBACK: Readonly<Record<Locale, string>> = {
  [Locale.En]: 'the Telegram bot',
  [Locale.Uk]: 'Telegram-бот',
};

export const TELEGRAM_TOKEN_REVOKED_EMAIL_COPY: Readonly<Record<Locale, ActionEmailCopy>> = {
  [Locale.En]: {
    subject: `Telegram bot token revoked for ${TELEGRAM_TOKEN_REVOKED_EMAIL_WORKSPACE_PLACEHOLDER}`,
    greeting: `Hi ${NAME_PLACEHOLDER},`,
    body: `Telegram rejected the bot token for ${TELEGRAM_TOKEN_REVOKED_EMAIL_CHANNEL_PLACEHOLDER} in ${TELEGRAM_TOKEN_REVOKED_EMAIL_WORKSPACE_PLACEHOLDER}. The channel is marked broken and cannot send or receive messages until you replace the token.`,
    action: 'Replace token',
    expiry: 'The channel page has the Replace token action.',
    ignore: `You get this email because you are an owner or admin of ${TELEGRAM_TOKEN_REVOKED_EMAIL_WORKSPACE_PLACEHOLDER}.`,
  },
  [Locale.Uk]: {
    subject: `Токен Telegram-бота відкликано для ${TELEGRAM_TOKEN_REVOKED_EMAIL_WORKSPACE_PLACEHOLDER}`,
    greeting: `Вітаємо, ${NAME_PLACEHOLDER}!`,
    body: `Telegram відхилив токен бота ${TELEGRAM_TOKEN_REVOKED_EMAIL_CHANNEL_PLACEHOLDER} у просторі ${TELEGRAM_TOKEN_REVOKED_EMAIL_WORKSPACE_PLACEHOLDER}. Канал позначено як зламаний, і він не надсилатиме та не прийматиме повідомлення, доки ви не заміните токен.`,
    action: 'Замінити токен',
    expiry: 'На сторінці каналу є дія «Замінити токен».',
    ignore: `Ви отримали цей лист, тому що є власником або адміністратором простору ${TELEGRAM_TOKEN_REVOKED_EMAIL_WORKSPACE_PLACEHOLDER}.`,
  },
};
