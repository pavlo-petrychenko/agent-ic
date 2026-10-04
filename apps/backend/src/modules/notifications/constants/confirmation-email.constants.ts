import { Locale } from '@agent-ic/contracts';
import { NAME_PLACEHOLDER } from '@/modules/notifications/constants/action-email.constants';
import type { ActionEmailCopy } from '@/modules/notifications/typedefs/email.typedefs';

export const CONFIRM_EMAIL_LINK_PATH = '/auth/confirm-email';

export const CONFIRMATION_EMAIL_COPY: Readonly<Record<Locale, ActionEmailCopy>> = {
  [Locale.En]: {
    subject: 'Confirm your email for agent-ic',
    greeting: `Hi ${NAME_PLACEHOLDER},`,
    body: 'Confirm your email address to finish creating your agent-ic account.',
    action: 'Confirm email',
    expiry: 'The link works for 24 hours.',
    ignore: 'If you did not sign up for agent-ic, you can ignore this email.',
  },
  [Locale.Uk]: {
    subject: 'Підтвердіть електронну пошту для agent-ic',
    greeting: `Вітаємо, ${NAME_PLACEHOLDER}!`,
    body: 'Підтвердіть адресу електронної пошти, щоб завершити створення облікового запису agent-ic.',
    action: 'Підтвердити пошту',
    expiry: 'Посилання діє 24 години.',
    ignore: 'Якщо ви не реєструвалися в agent-ic, просто проігноруйте цей лист.',
  },
};
