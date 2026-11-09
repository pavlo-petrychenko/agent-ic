import { Locale } from '@agent-ic/contracts';
import {
  ESCALATION_TELEGRAM_COPY,
  ESCALATION_TELEGRAM_MINUTES_PLACEHOLDER,
} from '@/modules/notifications/constants/escalation-telegram.constants';
import type { EscalationTelegramCopy } from '@/modules/notifications/typedefs/escalation-telegram.typedefs';

export const REMINDER_TELEGRAM_COPY: Readonly<Record<Locale, EscalationTelegramCopy>> = {
  [Locale.En]: {
    ...ESCALATION_TELEGRAM_COPY[Locale.En],
    title: `Still waiting · ${ESCALATION_TELEGRAM_MINUTES_PLACEHOLDER} min`,
    waitingLine: `Escalated ${ESCALATION_TELEGRAM_MINUTES_PLACEHOLDER} minutes ago; still unassigned.`,
    emptyReason: 'A chat is still waiting for your team.',
  },
  [Locale.Uk]: {
    ...ESCALATION_TELEGRAM_COPY[Locale.Uk],
    title: `Досі чекає · ${ESCALATION_TELEGRAM_MINUTES_PLACEHOLDER} хв`,
    waitingLine: `Чат передали ${ESCALATION_TELEGRAM_MINUTES_PLACEHOLDER} хвилин тому; його ще не взяли.`,
    emptyReason: 'Чат досі чекає на вашу команду.',
  },
};
