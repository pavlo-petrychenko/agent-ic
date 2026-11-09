import { Locale } from '@agent-ic/contracts';
import { NAME_PLACEHOLDER } from '@/modules/notifications/constants/action-email.constants';
import type { ActionEmailCopy } from '@/modules/notifications/typedefs/email.typedefs';

export const NOTIFICATION_EMAIL_VERIFICATION_PATH_PREFIX = '/w/';
export const NOTIFICATION_EMAIL_VERIFICATION_PATH_SUFFIX = '/settings/notifications';
export const NOTIFICATION_EMAIL_VERIFICATION_QUERY_PARAM = 'verifyEmail';
export const NOTIFICATION_EMAIL_VERIFICATION_WORKSPACE_PLACEHOLDER = '{workspace}';
export const NOTIFICATION_EMAIL_VERIFICATION_EMAIL_PLACEHOLDER = '{email}';

export const NOTIFICATION_EMAIL_VERIFICATION_COPY: Readonly<Record<Locale, ActionEmailCopy>> = {
  [Locale.En]: {
    subject: `Verify your alert email for ${NOTIFICATION_EMAIL_VERIFICATION_WORKSPACE_PLACEHOLDER}`,
    greeting: `Hi ${NAME_PLACEHOLDER},`,
    body: `Confirm ${NOTIFICATION_EMAIL_VERIFICATION_EMAIL_PLACEHOLDER} so agent-ic can send hand-off alerts for ${NOTIFICATION_EMAIL_VERIFICATION_WORKSPACE_PLACEHOLDER} to this address.`,
    action: 'Verify email',
    expiry: 'The link works for 24 hours.',
    ignore:
      'If you did not change this address, ignore this email. Alerts continue to go to your account email.',
  },
  [Locale.Uk]: {
    subject: `Підтвердіть пошту для сповіщень у ${NOTIFICATION_EMAIL_VERIFICATION_WORKSPACE_PLACEHOLDER}`,
    greeting: `Вітаємо, ${NAME_PLACEHOLDER}!`,
    body: `Підтвердьте ${NOTIFICATION_EMAIL_VERIFICATION_EMAIL_PLACEHOLDER}, щоб agent-ic надсилав сповіщення про передані чати для ${NOTIFICATION_EMAIL_VERIFICATION_WORKSPACE_PLACEHOLDER} на цю адресу.`,
    action: 'Підтвердити пошту',
    expiry: 'Посилання діє 24 години.',
    ignore:
      'Якщо ви не змінювали цю адресу, проігноруйте лист. Сповіщення й далі надходитимуть на пошту вашого облікового запису.',
  },
};
