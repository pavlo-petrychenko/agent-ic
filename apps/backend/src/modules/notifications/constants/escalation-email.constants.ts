import { Locale } from '@agent-ic/contracts';
import { NAME_PLACEHOLDER } from '@/modules/notifications/constants/action-email.constants';
import type { EscalationEmailCopy } from '@/modules/notifications/typedefs/email.typedefs';

export const ESCALATION_EMAIL_COPY: Readonly<Record<Locale, EscalationEmailCopy>> = {
  [Locale.En]: {
    subject: 'A chat needs a person',
    greeting: `Hi ${NAME_PLACEHOLDER},`,
    reasonLabel: 'Why this chat was escalated',
    messageLabel: 'Last customer message',
    emptyReason: 'A chat was escalated to you.',
    emptyMessage: 'No customer message is available.',
    action: 'Open in Inbox',
    footer: 'You can change these alerts in Settings, Notifications.',
  },
  [Locale.Uk]: {
    subject: 'Чат потребує людини',
    greeting: `Вітаємо, ${NAME_PLACEHOLDER}!`,
    reasonLabel: 'Чому цей чат передали вам',
    messageLabel: 'Останнє повідомлення клієнта',
    emptyReason: 'Чат передали вам.',
    emptyMessage: 'Повідомлення клієнта недоступне.',
    action: 'Відкрити у Вхідних',
    footer: 'Ці сповіщення можна змінити в Налаштуваннях, Сповіщення.',
  },
};
