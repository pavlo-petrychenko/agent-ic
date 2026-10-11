import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FLOW_BUILDER_NAMESPACE } from '@/features/flow-builder/constants/flowBuilderI18n.constants';
import { PALETTE_SECTIONS } from '@/features/flow-builder/constants/palette.constants';
import { newElementId } from '@/features/flow-builder/logic/helpers/id.helpers';
import { filterPalette } from '@/features/flow-builder/logic/helpers/palette.helpers';
import {
  belowLowestNode,
  placeStep,
} from '@/features/flow-builder/logic/helpers/placement.helpers';
import { useFlowBuilderStore } from '@/features/flow-builder/storage/hooks/useFlowBuilderStore';
import { StepPalette } from '@/features/flow-builder/view/StepPalette';

export function StepPalettePanel() {
  const { t } = useTranslation(FLOW_BUILDER_NAMESPACE);
  const { document, apply } = useFlowBuilderStore();
  const [query, setQuery] = useState('');

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
              position: belowLowestNode(document),
              after: null,
              splitEdgeId: null,
            },
            newElementId,
          ),
        )
      }
    />
  );
}
