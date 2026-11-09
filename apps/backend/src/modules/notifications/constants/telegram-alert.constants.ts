import { Locale } from '@agent-ic/contracts';

export const TELEGRAM_ALERTS_POLL_IDLE_MS = 1_000;
export const TELEGRAM_LINK_SWEEP_INTERVAL_SECONDS = 60;
export const TELEGRAM_ALERT_LAST_MESSAGE_MAX_LENGTH = 500;
export const TELEGRAM_ALERT_TAKE_OVER_COPY: Readonly<
  Record<
    Locale,
    {
      readonly invalid: string;
      readonly takenOver: string;
      readonly alreadyYours: string;
      readonly alreadyOther: string;
      readonly closed: string;
      readonly unavailable: string;
      readonly otherFallback: string;
      readonly openInInbox: string;
    }
  >
> = {
  [Locale.En]: {
    invalid: 'This button is no longer active.',
    takenOver: 'Chat taken over. Open it in the Inbox to reply.',
    alreadyYours: 'You already have this chat.',
    alreadyOther: 'This chat is already taken over by {name}.',
    closed: 'This chat is closed.',
    unavailable: 'This chat can no longer be taken over.',
    otherFallback: 'another operator',
    openInInbox: 'Open in Inbox',
  },
  [Locale.Uk]: {
    invalid: 'Ця кнопка вже неактивна.',
    takenOver: 'Чат взято. Відкрийте його у Вхідних, щоб відповісти.',
    alreadyYours: 'Цей чат уже у вас.',
    alreadyOther: 'Цей чат уже взяв {name}.',
    closed: 'Цей чат закрито.',
    unavailable: 'Цей чат більше не можна взяти.',
    otherFallback: 'інший оператор',
    openInInbox: 'Відкрити у Вхідних',
  },
};
export const TELEGRAM_ALERTS_LINK_INSTRUCTIONS =
  'Open Settings → Notifications in agent-ic, press Link Telegram, and send the code here.';
export const TELEGRAM_ALERTS_LINK_CONFIRMED =
  'Telegram is linked. You will get escalation alerts here.';
export const TELEGRAM_ALERTS_LINK_INVALID =
  'This code is invalid or already used. Create a new code in Settings → Notifications.';
export const TELEGRAM_ALERTS_LINK_EXPIRED =
  'This code has expired. Create a new code in Settings → Notifications.';
export const TELEGRAM_ALERTS_LINK_ALREADY =
  'This Telegram account is already linked to another alert chat.';
export const TELEGRAM_ALERTS_UNAUTHORIZED_MESSAGE = 'Telegram alerts webhook is unauthorized.';
