import { NodeType, isTriggerNode } from '@agent-ic/flow';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { FIRST_STEP_POSITION } from '@/features/flow-builder/constants/flowBuilder.constants';
import { FLOW_BUILDER_NAMESPACE } from '@/features/flow-builder/constants/flowBuilderI18n.constants';
import { NODE_PRESENTATION } from '@/features/flow-builder/constants/nodePresentation.constants';
import {
  PALETTE_SECTIONS,
  PaletteGroup,
} from '@/features/flow-builder/constants/palette.constants';
import { documentToCanvas } from '@/features/flow-builder/logic/helpers/canvas.helpers';
import { canConnect, connect } from '@/features/flow-builder/logic/helpers/connection.helpers';
import {
  addNode,
  duplicateNodes,
  moveNodes,
  removeElements,
} from '@/features/flow-builder/logic/helpers/graphEdit.helpers';
import { newElementId } from '@/features/flow-builder/logic/helpers/id.helpers';
import { toAddableType } from '@/features/flow-builder/logic/helpers/palette.helpers';
import {
  belowLowestNode,
  firstTriggerAnchor,
  placeStep,
} from '@/features/flow-builder/logic/helpers/placement.helpers';
import { useFlowIssues } from '@/features/flow-builder/logic/hooks/useFlowIssues';
import { useFlowBuilderStore } from '@/features/flow-builder/storage/hooks/useFlowBuilderStore';
import type { StepPlacement } from '@/features/flow-builder/typedefs/palette.typedefs';
import { BlankFlowHint } from '@/features/flow-builder/view/BlankFlowHint';
import { CanvasToolbar } from '@/features/flow-builder/view/CanvasToolbar';
import { StepNode } from '@/features/flow-builder/view/StepNode';
import { FlowCanvas } from '@/shared/ui/flow/FlowCanvas';
import type { FlowCanvasLabels, FlowCanvasNode } from '@/shared/ui/flow/FlowCanvas';

export function FlowEditor() {
  const { t } = useTranslation(FLOW_BUILDER_NAMESPACE);
  const { document, selection, viewport, density, apply, preview, undo, redo } =
    useFlowBuilderStore();
  const issues = useFlowIssues();
  const { select, setViewport, setDensity } = useFlowBuilderStore();

  const model = useMemo(() => documentToCanvas(document, issues), [document, issues]);
  const nodes: FlowCanvasNode[] = model.nodes.map((node) => ({
    id: node.id,
    label: node.label,
    position: node.position,
    hasInPort: node.hasInPort,
    outPorts: node.outPorts.map((port, index) => {
      const label = node.portLabels[index] ?? null;
      return {
        id: port,
        ariaLabel: t('canvas.connectFrom', { name: node.label, port }),
        label: label === null ? null : 'rule' in label ? label.rule : t(`port.${label.port}`),
      };
    }),
    render: (slots) => <StepNode node={node} slots={slots} density={density} />,
  }));
  const stepItems = PALETTE_SECTIONS.filter((section) => section.group !== PaletteGroup.Triggers)
    .flatMap((section) => section.types)
    .map((type) => ({ id: type, label: t(`step.${type}`), ...NODE_PRESENTATION[type] }));
  const blank = document.nodes.length > 0 && document.nodes.every((node) => isTriggerNode(node));
  const place = (value: string, placement: Omit<StepPlacement, 'type'>) => {
    const type = toAddableType(PALETTE_SECTIONS, value);
    if (type !== null) {
      apply(placeStep(document, { type, ...placement }, newElementId));
    }
  };

  const labels: FlowCanvasLabels = {
    canvas: t('canvas.label'),
    keyboardHelp: t('canvas.keyboardHelp'),
    port: t('canvas.port'),
    zoom: {
      toolbar: t('canvas.zoom.toolbar'),
      zoomIn: t('canvas.zoom.zoomIn'),
      zoomOut: t('canvas.zoom.zoomOut'),
      fit: t('canvas.zoom.fit'),
    },
    deleteConnection: t('canvas.deleteConnection'),
    selectionToolbar: t('canvas.selectionToolbar'),
    selectionCount: (count) => t('canvas.selectionCount', { count }),
    duplicate: t('canvas.duplicate'),
    delete: t('canvas.delete'),
    clearSelection: t('canvas.clearSelection'),
    deleted: t('canvas.deleted'),
    undo: t('canvas.undo'),
    addStep: t('canvas.addStep'),
    stepActions: t('canvas.stepActions'),
    connectingTo: (name) => t('canvas.connectingTo', { name }),
    emptyTitle: t('canvas.emptyTitle'),
    emptyDescription: t('canvas.emptyDescription'),
    emptyAction: t('canvas.emptyAction'),
  };

  return (
    <div className="relative min-h-0 min-w-0 flex-1">
      <FlowCanvas
        nodes={nodes}
        edges={model.edges}
        selection={selection}
        viewport={viewport}
        labels={labels}
        addStepItems={stepItems}
        canConnect={(source, target) => canConnect(document, source, target)}
        onViewportChange={setViewport}
        onNodesMove={(moves) => {
          const moved = moveNodes(document, moves);
          if (moves.some((move) => move.dragging)) {
            preview(moved);
          } else {
            apply(moved);
          }
        }}
        onSelectionChange={select}
        onConnect={(connection) => apply(connect(document, connection, newElementId()))}
        onDelete={(target) => apply(removeElements(document, target))}
        onUndo={undo}
        onRedo={redo}
        onDuplicate={(target) => {
          const copy = duplicateNodes(document, target.nodeIds, newElementId);
          apply(copy.document);
          select({ nodeIds: copy.nodeIds, edgeIds: [] });
        }}
        onOpenNode={(id) => select({ nodeIds: [id], edgeIds: [] })}
        onPaletteDrop={({ data, position, edgeId }) =>
          place(data, { position, after: null, splitEdgeId: edgeId })
        }
        onAddStep={({ itemId, position, source, sourcePort }) =>
          place(itemId, { position, after: { source, sourcePort }, splitEdgeId: null })
        }
        onAddTrigger={() =>
          apply(addNode(document, NodeType.TriggerMessage, FIRST_STEP_POSITION, newElementId()))
        }
      />
      <CanvasToolbar density={density} onDensityChange={setDensity} />
      {blank && (
        <BlankFlowHint
          items={stepItems.map((item) => ({ id: item.id, label: item.label }))}
          onAdd={(itemId) =>
            place(itemId, {
              position: belowLowestNode(document),
              after: firstTriggerAnchor(document),
              splitEdgeId: null,
            })
          }
        />
      )}
    </div>
  );
}
