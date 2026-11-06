import { Locale } from '@agent-ic/contracts';
import type { EscalationEmailCopy } from '@/modules/notifications/typedefs/email.typedefs';

export const ESCALATION_CUSTOMER_PLACEHOLDER = '{customer}';
export const ESCALATION_AGENT_PLACEHOLDER = '{agent}';
export const ESCALATION_CHANNEL_PLACEHOLDER = '{channel}';
export const ESCALATION_WORKSPACE_PLACEHOLDER = '{workspace}';

export const ESCALATION_EMAIL_COPY: Readonly<Record<Locale, EscalationEmailCopy>> = {
  [Locale.En]: {
    subject: `${ESCALATION_CUSTOMER_PLACEHOLDER} needs a person`,
    body: `${ESCALATION_AGENT_PLACEHOLDER} handed a ${ESCALATION_CHANNEL_PLACEHOLDER} to your team.`,
    reasonLabel: 'Reason:',
    emptyReason: 'A chat was escalated to your team.',
    emptyMessage: 'No customer message is available.',
    action: 'Open in Inbox',
    footer: `You get this because email alerts are on for you in ${ESCALATION_WORKSPACE_PLACEHOLDER}. Change it in Settings › Notifications.`,
    metaTo: 'to',
    customerFallback: 'A customer',
    agentFallback: 'The agent',
    workspaceFallback: 'your workspace',
    channelTelegram: 'Telegram chat',
    channelApi: 'API chat',
    channelFallback: 'chat',
  },
  [Locale.Uk]: {
    subject: `${ESCALATION_CUSTOMER_PLACEHOLDER} потребує людини`,
    body: `${ESCALATION_AGENT_PLACEHOLDER} передав ${ESCALATION_CHANNEL_PLACEHOLDER} вашій команді.`,
    reasonLabel: 'Причина:',
    emptyReason: 'Чат передали вашій команді.',
    emptyMessage: 'Повідомлення клієнта недоступне.',
    action: 'Відкрити у Вхідних',
    footer: `Ви отримуєте це, бо сповіщення електронною поштою ввімкнені для вас у ${ESCALATION_WORKSPACE_PLACEHOLDER}. Змініть це в Налаштуваннях › Сповіщення.`,
    metaTo: 'до',
    customerFallback: 'Клієнт',
    agentFallback: 'Агент',
    workspaceFallback: 'вашому робочому просторі',
    channelTelegram: 'Telegram-чат',
    channelApi: 'API-чат',
    channelFallback: 'чат',
  },
};
