import { Locale } from '@agent-ic/contracts';
import { Namespace } from '@/shared/i18n/constants/namespace.constants';
import enAuth from '@/shared/i18n/locales/en/auth.json';
import enCommon from '@/shared/i18n/locales/en/common.json';
import enErrors from '@/shared/i18n/locales/en/errors.json';
import enSettings from '@/shared/i18n/locales/en/settings.json';
import enWorkspace from '@/shared/i18n/locales/en/workspace.json';
import ukAuth from '@/shared/i18n/locales/uk/auth.json';
import ukCommon from '@/shared/i18n/locales/uk/common.json';
import ukErrors from '@/shared/i18n/locales/uk/errors.json';
import ukSettings from '@/shared/i18n/locales/uk/settings.json';
import ukWorkspace from '@/shared/i18n/locales/uk/workspace.json';

export const resources = {
  [Locale.En]: {
    [Namespace.Common]: enCommon,
    [Namespace.Errors]: enErrors,
    [Namespace.Auth]: enAuth,
    [Namespace.Workspace]: enWorkspace,
    [Namespace.Settings]: enSettings,
  },
  [Locale.Uk]: {
    [Namespace.Common]: ukCommon,
    [Namespace.Errors]: ukErrors,
    [Namespace.Auth]: ukAuth,
    [Namespace.Workspace]: ukWorkspace,
    [Namespace.Settings]: ukSettings,
  },
} as const;
