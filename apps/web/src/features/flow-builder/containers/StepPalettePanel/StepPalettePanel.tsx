import { TRIGGER_NODE_TYPES } from '@agent-ic/flow';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FLOW_BUILDER_NAMESPACE } from '@/features/flow-builder/constants/flowBuilderI18n.constants';
import { PALETTE_SECTIONS } from '@/features/flow-builder/constants/palette.constants';
import type { StepPalettePanelProps } from '@/features/flow-builder/containers/StepPalettePanel/StepPalettePanel.typedefs';
import { newElementId } from '@/features/flow-builder/logic/helpers/id.helpers';
import { filterPalette } from '@/features/flow-builder/logic/helpers/palette.helpers';
import {
  belowLowestNode,
  nextTriggerPosition,
  placeStep,
} from '@/features/flow-builder/logic/helpers/placement.helpers';
import { usePaletteAgentExits } from '@/features/flow-builder/logic/hooks/usePaletteAgentExits';
import { useWorkspaceTimeZone } from '@/features/flow-builder/logic/hooks/useWorkspaceTimeZone';
import { useFlowBuilderStore } from '@/features/flow-builder/storage/hooks/useFlowBuilderStore';
import { StepPalette } from '@/features/flow-builder/view/StepPalette';

const isTriggerType = (type: string): boolean =>
  TRIGGER_NODE_TYPES.some((trigger) => trigger === type);

export function StepPalettePanel({ workspaceId }: StepPalettePanelProps) {
  const { t } = useTranslation(FLOW_BUILDER_NAMESPACE);
  const { document, apply } = useFlowBuilderStore();
  const timeZone = useWorkspaceTimeZone(workspaceId);
  const [query, setQuery] = useState('');
  const agentExits = usePaletteAgentExits();

  return (
    <StepPalette
      sections={filterPalette(PALETTE_SECTIONS, query, (type) => t(`step.${type}`))}
      query={query}
      onQueryChange={setQuery}
      onAdd={(type) =>
        apply(
          placeStep(
            document,
            {
              type,
              label: t(`step.${type}`),
              position: isTriggerType(type)
                ? nextTriggerPosition(document)
                : belowLowestNode(document),
              after: null,
              splitEdgeId: null,
              agentExits,
            },
            newElementId,
            timeZone,
          ),
        )
      }
    />
  );
}
