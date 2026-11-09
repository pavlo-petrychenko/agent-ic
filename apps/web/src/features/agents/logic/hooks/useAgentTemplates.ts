import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { FLOW_BUILDER_NAMESPACE } from '@/features/agents/constants/agentsI18n.constants';
import { TEMPLATE_PREVIEW_TIME_ZONE } from '@/features/agents/constants/agentTemplate.constants';
import { toTemplateCards } from '@/features/agents/logic/helpers/agentTemplate.helpers';
import type { AgentTemplateCard } from '@/features/agents/typedefs/agentTemplate.typedefs';
import { useLocale } from '@/shared/i18n/hooks/useLocale';

export function useAgentTemplates(timeZone: string | null): readonly AgentTemplateCard[] {
  const { locale } = useLocale();
  const { t } = useTranslation(FLOW_BUILDER_NAMESPACE);

  return useMemo(
    () =>
      toTemplateCards(locale, timeZone ?? TEMPLATE_PREVIEW_TIME_ZONE, (type) => t(`step.${type}`)),
    [locale, timeZone, t],
  );
}
