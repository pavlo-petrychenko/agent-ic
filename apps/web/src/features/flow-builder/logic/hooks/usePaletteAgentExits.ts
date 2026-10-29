import { AgentExitKind } from '@agent-ic/flow';
import type { AgentExits } from '@agent-ic/flow';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { FLOW_BUILDER_NAMESPACE } from '@/features/flow-builder/constants/flowBuilderI18n.constants';
import { paletteAgentExits } from '@/features/flow-builder/logic/helpers/agentExit.helpers';

export function usePaletteAgentExits(): AgentExits {
  const { t } = useTranslation(FLOW_BUILDER_NAMESPACE);
  const when = t(`inspector.agent.exits.defaultWhen.${AgentExitKind.Handoff}`);
  return useMemo(() => paletteAgentExits(when), [when]);
}
