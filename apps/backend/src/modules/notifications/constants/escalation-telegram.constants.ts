import { Locale } from '@agent-ic/contracts';
import type { EscalationTelegramCopy } from '@/modules/notifications/typedefs/escalation-telegram.typedefs';

export const ESCALATION_TELEGRAM_COPY: Readonly<Record<Locale, EscalationTelegramCopy>> = {
  [Locale.En]: {
    title: 'Chat needs a person',
    reasonLabel: 'Reason:',
    emptyReason: 'A chat was escalated to your team.',
    emptyMessage: 'No customer message is available.',
    openInInbox: 'Open in Inbox',
    takeOver: 'Take over',
    customerFallback: 'A customer',
    agentFallback: 'The agent',
    channelTelegram: 'Telegram',
    channelApi: 'API',
    channelFallback: 'Chat',
  },
  [Locale.Uk]: {
    title: 'Чат потребує людини',
    reasonLabel: 'Причина:',
    emptyReason: 'Чат передали вашій команді.',
    emptyMessage: 'Повідомлення клієнта недоступне.',
    openInInbox: 'Відкрити у Вхідних',
    takeOver: 'Взяти чат',
    customerFallback: 'Клієнт',
    agentFallback: 'Агент',
    channelTelegram: 'Telegram',
    channelApi: 'API',
    channelFallback: 'Чат',
  },
};
