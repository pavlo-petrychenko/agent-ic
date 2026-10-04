import { Locale } from '@agent-ic/contracts';
import { NAME_PLACEHOLDER } from '@/modules/notifications/constants/action-email.constants';
import type { ActionEmailCopy } from '@/modules/notifications/typedefs/email.typedefs';

export const RESET_PASSWORD_LINK_PATH = '/auth/reset-password';

export const PASSWORD_RESET_EMAIL_COPY: Readonly<Record<Locale, ActionEmailCopy>> = {
  [Locale.En]: {
    subject: 'Reset your agent-ic password',
    greeting: `Hi ${NAME_PLACEHOLDER},`,
    body: 'We received a request to reset the password of your agent-ic account.',
    action: 'Choose a new password',
    expiry: 'The link works for 1 hour and only once.',
    ignore: 'If you did not ask for this, you can ignore this email. Your password stays the same.',
  },
  [Locale.Uk]: {
    subject: 'Скиньте пароль для agent-ic',
    greeting: `Вітаємо, ${NAME_PLACEHOLDER}!`,
    body: 'Ми отримали запит на скидання пароля вашого облікового запису agent-ic.',
    action: 'Обрати новий пароль',
    expiry: 'Посилання діє 1 годину і лише один раз.',
    ignore: 'Якщо ви цього не просили, просто проігноруйте цей лист. Ваш пароль не зміниться.',
  },
};
