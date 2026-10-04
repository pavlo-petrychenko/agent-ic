import enCommon from './locales/en/common.json';
import enErrors from './locales/en/errors.json';
import ukCommon from './locales/uk/common.json';
import ukErrors from './locales/uk/errors.json';
import { Locale, Namespace } from './i18n.constants';

export const resources = {
  [Locale.En]: { [Namespace.Common]: enCommon, [Namespace.Errors]: enErrors },
  [Locale.Uk]: { [Namespace.Common]: ukCommon, [Namespace.Errors]: ukErrors },
} as const;
