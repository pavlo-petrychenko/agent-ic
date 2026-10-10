import { Locale } from '@agent-ic/contracts';
import { Namespace } from '@/shared/i18n/constants/namespace.constants';
import enAgents from '@/shared/i18n/locales/en/agents.json';
import enAuth from '@/shared/i18n/locales/en/auth.json';
import enCommon from '@/shared/i18n/locales/en/common.json';
import enErrors from '@/shared/i18n/locales/en/errors.json';
import enFlowBuilder from '@/shared/i18n/locales/en/flowBuilder.json';
import enSettings from '@/shared/i18n/locales/en/settings.json';
import enTesting from '@/shared/i18n/locales/en/testing.json';
import enWorkspace from '@/shared/i18n/locales/en/workspace.json';
import ukAgents from '@/shared/i18n/locales/uk/agents.json';
import ukAuth from '@/shared/i18n/locales/uk/auth.json';
import ukCommon from '@/shared/i18n/locales/uk/common.json';
import ukErrors from '@/shared/i18n/locales/uk/errors.json';
import ukFlowBuilder from '@/shared/i18n/locales/uk/flowBuilder.json';
import ukSettings from '@/shared/i18n/locales/uk/settings.json';
import ukTesting from '@/shared/i18n/locales/uk/testing.json';
import ukWorkspace from '@/shared/i18n/locales/uk/workspace.json';

export const resources = {
  [Locale.En]: {
    [Namespace.Common]: enCommon,
    [Namespace.Errors]: enErrors,
    [Namespace.Auth]: enAuth,
    [Namespace.Workspace]: enWorkspace,
    [Namespace.Settings]: enSettings,
    [Namespace.Agents]: enAgents,
    [Namespace.FlowBuilder]: enFlowBuilder,
    [Namespace.Testing]: enTesting,
  },
  [Locale.Uk]: {
    [Namespace.Common]: ukCommon,
    [Namespace.Errors]: ukErrors,
    [Namespace.Auth]: ukAuth,
    [Namespace.Workspace]: ukWorkspace,
    [Namespace.Settings]: ukSettings,
    [Namespace.Agents]: ukAgents,
    [Namespace.FlowBuilder]: ukFlowBuilder,
    [Namespace.Testing]: ukTesting,
  },
} as const;
