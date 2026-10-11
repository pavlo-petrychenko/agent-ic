import { NodeType } from '@agent-ic/flow';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { FIRST_STEP_POSITION } from '@/features/flow-builder/constants/flowBuilder.constants';
import { FLOW_BUILDER_NAMESPACE } from '@/features/flow-builder/constants/flowBuilderI18n.constants';
import { documentToCanvas } from '@/features/flow-builder/logic/helpers/canvas.helpers';
import { canConnect, connect } from '@/features/flow-builder/logic/helpers/connection.helpers';
import {
  addNode,
  duplicateNodes,
  moveNodes,
  removeElements,
} from '@/features/flow-builder/logic/helpers/graphEdit.helpers';
import { newElementId } from '@/features/flow-builder/logic/helpers/id.helpers';
import { useFlowBuilderStore } from '@/features/flow-builder/storage/hooks/useFlowBuilderStore';
import { StepNode } from '@/features/flow-builder/view/StepNode';
import { FlowCanvas } from '@/shared/ui/flow/FlowCanvas';
import type { FlowCanvasLabels, FlowCanvasNode } from '@/shared/ui/flow/FlowCanvas';

export function FlowEditor() {
  const { t } = useTranslation(FLOW_BUILDER_NAMESPACE);
  const { document, issues, selection, viewport, apply, preview, undo, redo, select, setViewport } =
    useFlowBuilderStore();

  const model = useMemo(() => documentToCanvas(document, issues), [document, issues]);
  const nodes: FlowCanvasNode[] = model.nodes.map((node) => ({
    id: node.id,
    label: node.label,
    position: node.position,
    hasInPort: node.hasInPort,
    outPorts: node.outPorts.map((port) => ({
      id: port,
      ariaLabel: t('canvas.connectFrom', { name: node.label, port }),
    })),
    render: (slots) => <StepNode node={node} slots={slots} />,
  }));

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
    connectingTo: (name) => t('canvas.connectingTo', { name }),
    emptyTitle: t('canvas.emptyTitle'),
    emptyDescription: t('canvas.emptyDescription'),
    emptyAction: t('canvas.emptyAction'),
  };

  return (
    <div className="relative min-h-0 flex-1">
      <FlowCanvas
        nodes={nodes}
        edges={model.edges}
        selection={selection}
        viewport={viewport}
        labels={labels}
        addStepItems={[]}
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
        onPaletteDrop={() => undefined}
        onAddStep={() => undefined}
        onAddTrigger={() =>
          apply(addNode(document, NodeType.TriggerMessage, FIRST_STEP_POSITION, newElementId()))
        }
      />
    </div>
  );
}
