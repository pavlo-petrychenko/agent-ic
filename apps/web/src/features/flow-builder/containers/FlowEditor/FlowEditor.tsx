import { NO_AGENT_EXITS, NodeType, isTriggerNode } from '@agent-ic/flow';
import type { AgentExitKind } from '@agent-ic/flow';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useModelOptions } from '@/features/flow-builder/communication/hooks/useModelOptions';
import { EXIT_ICONS } from '@/features/flow-builder/constants/agentExit.constants';
import { FIRST_STEP_POSITION } from '@/features/flow-builder/constants/flowBuilder.constants';
import { FLOW_BUILDER_NAMESPACE } from '@/features/flow-builder/constants/flowBuilderI18n.constants';
import { LLM_STEP_TYPES } from '@/features/flow-builder/constants/llmStep.constants';
import { NODE_PRESENTATION } from '@/features/flow-builder/constants/nodePresentation.constants';
import {
  PALETTE_SECTIONS,
  PaletteGroup,
} from '@/features/flow-builder/constants/palette.constants';
import type { FlowEditorProps } from '@/features/flow-builder/containers/FlowEditor/FlowEditor.typedefs';
import {
  customizeExit,
  defaultExitPorts,
  exitKindOf,
} from '@/features/flow-builder/logic/helpers/agentExit.helpers';
import { documentToCanvas } from '@/features/flow-builder/logic/helpers/canvas.helpers';
import { canConnect, connect } from '@/features/flow-builder/logic/helpers/connection.helpers';
import {
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
import { usePaletteAgentExits } from '@/features/flow-builder/logic/hooks/usePaletteAgentExits';
import { useWorkspaceTimeZone } from '@/features/flow-builder/logic/hooks/useWorkspaceTimeZone';
import { useFlowBuilderStore } from '@/features/flow-builder/storage/hooks/useFlowBuilderStore';
import type { StepPlacement } from '@/features/flow-builder/typedefs/palette.typedefs';
import { BlankFlowHint } from '@/features/flow-builder/view/BlankFlowHint';
import { CanvasToolbar } from '@/features/flow-builder/view/CanvasToolbar';
import { StepNode } from '@/features/flow-builder/view/StepNode';
import { FlowCanvas } from '@/shared/ui/flow/FlowCanvas';
import type { FlowCanvasLabels, FlowCanvasNode, FlowCanvasPort } from '@/shared/ui/flow/FlowCanvas';

export function FlowEditor({ workspaceId }: FlowEditorProps) {
  const { t } = useTranslation(FLOW_BUILDER_NAMESPACE);
  const { document, selection, viewport, density, apply, preview, undo, redo } =
    useFlowBuilderStore();
  const issues = useFlowIssues();
  const agentExits = usePaletteAgentExits();
  const timeZone = useWorkspaceTimeZone(workspaceId);
  const { select, setViewport, setDensity, settingsOpen, setSettingsOpen } = useFlowBuilderStore();
  const [reveal, setReveal] = useState<readonly string[] | null>(null);

  const { models } = useModelOptions(
    !document.nodes.some((node) => LLM_STEP_TYPES.some((type) => type === node.type)),
  );

  const model = useMemo(
    () => documentToCanvas(document, issues, models),
    [document, issues, models],
  );
  const customize = (nodeId: string, kind: AgentExitKind) => {
    const customized = customizeExit(
      document,
      nodeId,
      kind,
      {
        send: t(`canvas.exitSteps.${kind}.send`),
        finish: t(`canvas.exitSteps.${kind}.finish`),
      },
      newElementId,
    );
    if (customized.nodeIds.length > 0) {
      apply(customized.document);
      select({ nodeIds: customized.nodeIds.slice(-1), edgeIds: [] });
      setReveal([nodeId, ...customized.nodeIds]);
    }
  };
  const nodes: FlowCanvasNode[] = model.nodes.map((node) => {
    const unconnected = defaultExitPorts(document, node.id);
    return {
      id: node.id,
      label: node.label,
      position: node.position,
      hasInPort: node.hasInPort,
      outPorts: node.outPorts.map((port, index): FlowCanvasPort => {
        const label = node.portLabels[index] ?? null;
        const kind = exitKindOf(port);
        const stack = kind === null ? -1 : unconnected.indexOf(kind);
        return {
          id: port,
          ariaLabel: t('canvas.connectFrom', { name: node.label, port }),
          label: label === null ? null : 'rule' in label ? label.rule : t(`port.${label.port}`),
          terminal:
            kind === null || stack < 0
              ? null
              : {
                  label: t(`canvas.exitDefault.${kind}`),
                  icon: EXIT_ICONS[kind],
                  actionLabel: t('canvas.customize'),
                  actionAriaLabel: t('canvas.customizeExit', {
                    name: node.label,
                    exit: t(`port.${kind}`),
                  }),
                  stacked: stack > 0,
                  onAction: () => customize(node.id, kind),
                },
        };
      }),
      render: (slots) => <StepNode node={node} slots={slots} density={density} />,
    };
  });
  const stepItems = PALETTE_SECTIONS.filter((section) => section.group !== PaletteGroup.Triggers)
    .flatMap((section) => section.types)
    .map((type) => ({ id: type, label: t(`step.${type}`), ...NODE_PRESENTATION[type] }));
  const blank = document.nodes.length > 0 && document.nodes.every((node) => isTriggerNode(node));
  const blankAnchor = blank ? firstTriggerAnchor(document) : null;
  const place = (
    value: string,
    placement: Omit<StepPlacement, 'type' | 'label' | 'agentExits'>,
  ) => {
    const type = toAddableType(PALETTE_SECTIONS, value);
    if (type !== null) {
      apply(
        placeStep(
          document,
          { type, label: t(`step.${type}`), agentExits, ...placement },
          newElementId,
          timeZone,
        ),
      );
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
        placeholder={
          blankAnchor === null
            ? null
            : {
                anchorId: blankAnchor.source,
                content: (
                  <BlankFlowHint
                    items={stepItems.map((item) => ({ id: item.id, label: item.label }))}
                    onAdd={(itemId) =>
                      place(itemId, {
                        position: belowLowestNode(document),
                        after: blankAnchor,
                        splitEdgeId: null,
                      })
                    }
                  />
                ),
              }
        }
        edges={model.edges}
        reveal={reveal}
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
          apply(
            placeStep(
              document,
              {
                type: NodeType.TriggerMessage,
                label: t(`step.${NodeType.TriggerMessage}`),
                position: FIRST_STEP_POSITION,
                after: null,
                splitEdgeId: null,
                agentExits: NO_AGENT_EXITS,
              },
              newElementId,
            ),
          )
        }
      />
      <CanvasToolbar
        density={density}
        onDensityChange={setDensity}
        settingsOpen={settingsOpen}
        onSettingsOpen={() => setSettingsOpen(true)}
      />
    </div>
  );
}
