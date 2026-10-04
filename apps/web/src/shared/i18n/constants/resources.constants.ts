import { Locale } from '@agent-ic/contracts';
import { Namespace } from '@/shared/i18n/constants/namespace.constants';
import enCommon from '@/shared/i18n/locales/en/common.json';
import enErrors from '@/shared/i18n/locales/en/errors.json';
import ukCommon from '@/shared/i18n/locales/uk/common.json';
import ukErrors from '@/shared/i18n/locales/uk/errors.json';

export const resources = {
  [Locale.En]: { [Namespace.Common]: enCommon, [Namespace.Errors]: enErrors },
  [Locale.Uk]: { [Namespace.Common]: ukCommon, [Namespace.Errors]: ukErrors },
} as const;
