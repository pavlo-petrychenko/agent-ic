import { Locale } from '@agent-ic/contracts';
import { NAME_PLACEHOLDER } from '@/modules/notifications';
import type { ActionEmailCopy } from '@/modules/notifications';
import { UsageThreshold } from '@/modules/usage/constants/usage.constants';

export const WORKSPACE_PLACEHOLDER = '{workspace}';

export const USAGE_SETTINGS_PATH_PREFIX = '/w/';
export const USAGE_SETTINGS_PATH_SUFFIX = '/settings/usage';

export const USAGE_THRESHOLD_EMAIL_COPY: Readonly<
  Record<Locale, Readonly<Record<UsageThreshold, ActionEmailCopy>>>
> = {
  [Locale.En]: {
    [UsageThreshold.Warn]: {
      subject: `${WORKSPACE_PLACEHOLDER} used 80% of this month's usage limit`,
      greeting: `Hi ${NAME_PLACEHOLDER},`,
      body: `${WORKSPACE_PLACEHOLDER} has used 80% of this month's platform model credits. At 100%, agents on platform models stop answering until the first day of next month.`,
      action: 'See usage',
      expiry: 'Steps that run on your own provider keys are not affected.',
      ignore: 'You get this email once a month.',
    },
    [UsageThreshold.Limit]: {
      subject: `${WORKSPACE_PLACEHOLDER} reached this month's usage limit`,
      greeting: `Hi ${NAME_PLACEHOLDER},`,
      body: `${WORKSPACE_PLACEHOLDER} has used all of this month's platform model credits. Agents on platform models are not answering until the first day of next month.`,
      action: 'See usage',
      expiry: 'Steps that run on your own provider keys keep answering.',
      ignore: 'You get this email once a month.',
    },
  },
  [Locale.Uk]: {
    [UsageThreshold.Warn]: {
      subject: `${WORKSPACE_PLACEHOLDER} використав 80% місячного ліміту`,
      greeting: `Вітаємо, ${NAME_PLACEHOLDER}!`,
      body: `${WORKSPACE_PLACEHOLDER} використав 80% кредитів на моделі платформи цього місяця. На 100% агенти на моделях платформи перестануть відповідати до першого числа наступного місяця.`,
      action: 'Переглянути використання',
      expiry: 'Кроки, що працюють на ваших власних ключах провайдерів, це не зачіпає.',
      ignore: 'Цей лист надходить раз на місяць.',
    },
    [UsageThreshold.Limit]: {
      subject: `${WORKSPACE_PLACEHOLDER} вичерпав місячний ліміт`,
      greeting: `Вітаємо, ${NAME_PLACEHOLDER}!`,
      body: `${WORKSPACE_PLACEHOLDER} використав усі кредити на моделі платформи цього місяця. Агенти на моделях платформи не відповідатимуть до першого числа наступного місяця.`,
      action: 'Переглянути використання',
      expiry: 'Кроки, що працюють на ваших власних ключах провайдерів, і далі відповідають.',
      ignore: 'Цей лист надходить раз на місяць.',
    },
  },
};
