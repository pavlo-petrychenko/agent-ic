import { Locale } from '@agent-ic/contracts';
import {
  ESCALATION_CUSTOMER_PLACEHOLDER,
  ESCALATION_EMAIL_COPY,
  ESCALATION_MINUTES_PLACEHOLDER,
} from '@/modules/notifications/constants/escalation-email.constants';
import type { EscalationEmailCopy } from '@/modules/notifications/typedefs/email.typedefs';

export const REMINDER_EMAIL_COPY: Readonly<Record<Locale, EscalationEmailCopy>> = {
  [Locale.En]: {
    ...ESCALATION_EMAIL_COPY[Locale.En],
    title: `${ESCALATION_CUSTOMER_PLACEHOLDER} has been waiting for a person for ${ESCALATION_MINUTES_PLACEHOLDER} minutes`,
    subject: `Still waiting: ${ESCALATION_CUSTOMER_PLACEHOLDER} — ${ESCALATION_MINUTES_PLACEHOLDER} min`,
    body: `The chat was escalated ${ESCALATION_MINUTES_PLACEHOLDER} minutes ago and has not been taken yet.`,
    emptyReason: 'A chat is still waiting for your team.',
  },
  [Locale.Uk]: {
    ...ESCALATION_EMAIL_COPY[Locale.Uk],
    title: `${ESCALATION_CUSTOMER_PLACEHOLDER} чекає на оператора вже ${ESCALATION_MINUTES_PLACEHOLDER} хвилин`,
    subject: `Досі чекає: ${ESCALATION_CUSTOMER_PLACEHOLDER} — ${ESCALATION_MINUTES_PLACEHOLDER} хв`,
    body: `Чат передали команді ${ESCALATION_MINUTES_PLACEHOLDER} хвилин тому, і його ще ніхто не взяв.`,
    emptyReason: 'Чат досі чекає на вашу команду.',
  },
};
