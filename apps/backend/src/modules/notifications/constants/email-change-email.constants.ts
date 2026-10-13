import { Locale } from '@agent-ic/contracts';
import { NAME_PLACEHOLDER } from '@/modules/notifications/constants/action-email.constants';
import type { ActionEmailCopy } from '@/modules/notifications/typedefs/email.typedefs';

export const EMAIL_CHANGE_LINK_PATH = '/auth/confirm-email-change';

export const EMAIL_CHANGE_EMAIL_COPY: Readonly<Record<Locale, ActionEmailCopy>> = {
  [Locale.En]: {
    subject: 'Confirm your new agent-ic email',
    greeting: `Hi ${NAME_PLACEHOLDER},`,
    body: 'Confirm this address to finish changing the email of your agent-ic account.',
    action: 'Confirm new email',
    expiry: 'The link works for 24 hours.',
    ignore: 'If you did not ask for this, you can ignore this email. Your address stays the same.',
  },
  [Locale.Uk]: {
    subject: 'Підтвердіть нову електронну пошту для agent-ic',
    greeting: `Вітаємо, ${NAME_PLACEHOLDER}!`,
    body: 'Підтвердіть цю адресу, щоб завершити зміну електронної пошти вашого облікового запису agent-ic.',
    action: 'Підтвердити нову пошту',
    expiry: 'Посилання діє 24 години.',
    ignore:
      'Якщо ви цього не просили, просто проігноруйте цей лист. Ваша адреса залишиться незмінною.',
  },
};
