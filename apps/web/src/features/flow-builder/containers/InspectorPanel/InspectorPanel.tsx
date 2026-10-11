import {
  MAX_LABEL_LENGTH,
  MAX_ROUTER_RULES,
  NodeType,
  PortName,
  triggerVariables,
  visibleVariables,
} from '@agent-ic/flow';
import type { FlowNode } from '@agent-ic/flow';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { EMPTY_SELECTION } from '@/features/flow-builder/constants/flowBuilder.constants';
import { FLOW_BUILDER_NAMESPACE } from '@/features/flow-builder/constants/flowBuilderI18n.constants';
import { DESCRIBED_NODE_TYPES } from '@/features/flow-builder/constants/inspector.constants';
import { NODE_PRESENTATION } from '@/features/flow-builder/constants/nodePresentation.constants';
import { renameKey } from '@/features/flow-builder/logic/helpers/graphEdit.helpers';
import { newElementId } from '@/features/flow-builder/logic/helpers/id.helpers';
import {
  branchRows,
  fieldErrors,
  fieldRows,
  nodeName,
  observerNames,
  portTargets,
  proposeKeyRename,
  updateNode,
} from '@/features/flow-builder/logic/helpers/inspector.helpers';
import {
  addRule,
  conditionView,
  moveRule,
  renameRule,
  removeRule,
  updateCondition,
} from '@/features/flow-builder/logic/helpers/router.helpers';
import { useFlowIssues } from '@/features/flow-builder/logic/hooks/useFlowIssues';
import { useFlowBuilderStore } from '@/features/flow-builder/storage/hooks/useFlowBuilderStore';
import type { KeyRename } from '@/features/flow-builder/typedefs/inspector.typedefs';
import { InlineEditField } from '@/features/flow-builder/view/InlineEditField';
import { ParallelInspector } from '@/features/flow-builder/view/ParallelInspector';
import { RouterInspector } from '@/features/flow-builder/view/RouterInspector';
import { TriggerInspector } from '@/features/flow-builder/view/TriggerInspector';
import { Button, ButtonVariant } from '@/shared/ui/actions/Button';
import { Inspector } from '@/shared/ui/layout/Inspector';
import { Dialog } from '@/shared/ui/overlays/Dialog';

export function InspectorPanel() {
  const { t } = useTranslation(FLOW_BUILDER_NAMESPACE);
  const document = useFlowBuilderStore((state) => state.document);
  const selection = useFlowBuilderStore((state) => state.selection);
  const apply = useFlowBuilderStore((state) => state.apply);
  const select = useFlowBuilderStore((state) => state.select);
  const issues = useFlowIssues();
  const [keyRename, setKeyRename] = useState<KeyRename | null>(null);
  const [nodeId] = selection.nodeIds.length === 1 ? selection.nodeIds : [null];
  const node = document.nodes.find((candidate) => candidate.id === nodeId) ?? null;
  const variables = useMemo(
    () => (node === null ? [] : visibleVariables(document, node.id)),
    [document, node],
  );

  const body = (current: FlowNode) => {
    switch (current.type) {
      case NodeType.TriggerMessage:
        return (
          <TriggerInspector
            fields={fieldRows(
              triggerVariables(current).map((field) => ({ ...field, values: null })),
            )}
          />
        );
      case NodeType.Parallel:
        return (
          <ParallelInspector
            branches={branchRows(document, current, PortName.Branches)}
            waitFor={current.config.waitFor}
            onWaitForChange={(waitFor) =>
              apply(
                updateNode(document, current.id, (step) =>
                  step.type === NodeType.Parallel
                    ? { ...step, config: { ...step.config, waitFor } }
                    : step,
                ),
              )
            }
          />
        );
      case NodeType.Router:
        return (
          <RouterInspector
            routes={current.config.rules.map((rule) => ({
              rule,
              targets: portTargets(document, current.id, rule.id),
              conditions: rule.conditions.map((condition) => conditionView(condition, variables)),
            }))}
            fields={fieldRows(variables)}
            otherwise={portTargets(document, current.id, PortName.Else)}
            observers={observerNames(document, current.id)}
            errors={fieldErrors(issues, current.id)}
            canAddRoute={current.config.rules.length < MAX_ROUTER_RULES}
            onAddRoute={() => apply(addRule(document, current.id, newElementId(), variables))}
            onRenameRoute={(ruleId, label) =>
              apply(renameRule(document, current.id, ruleId, label))
            }
            onMoveRoute={(ruleId, offset) => apply(moveRule(document, current.id, ruleId, offset))}
            onRemoveRoute={(ruleId) => apply(removeRule(document, current.id, ruleId))}
            onConditionChange={(ruleId, index, patch) =>
              apply(updateCondition(document, current.id, ruleId, index, patch, variables))
            }
          />
        );
      default:
        return null;
    }
  };

  const inspector = (current: FlowNode) => {
    const name = nodeName(current);
    const described = DESCRIBED_NODE_TYPES.find((type) => type === current.type) ?? null;
    return (
      <Inspector
        kind={{ label: t(`inspector.kind.${current.type}`), ...NODE_PRESENTATION[current.type] }}
        title={name}
        subtitle={described === null ? null : t(`inspector.description.${described}`)}
        heading={
          <InlineEditField
            key={current.id}
            value={current.label === '' ? null : current.label}
            placeholder={name}
            editLabel={t('inspector.rename')}
            inputLabel={t('inspector.nameLabel')}
            maxLength={MAX_LABEL_LENGTH}
            required={false}
            current={false}
            inheritFont
            flush
            onCommit={(label) => {
              const renamed = updateNode(document, current.id, (step) => ({ ...step, label }));
              apply(renamed);
              setKeyRename(proposeKeyRename(renamed, current.id, label));
            }}
          />
        }
        closeLabel={t('inspector.close')}
        onClose={() => select(EMPTY_SELECTION)}
      >
        {body(current)}
      </Inspector>
    );
  };

  return (
    <>
      {node !== null && inspector(node)}
      <Dialog
        open={keyRename !== null}
        onOpenChange={() => setKeyRename(null)}
        title={t('inspector.renameKey.title')}
        description={
          keyRename === null ? null : t('inspector.renameKey.description', { ...keyRename })
        }
        closeLabel={t('inspector.renameKey.keep', { key: keyRename?.from ?? '' })}
        footerRight={
          <>
            <Button variant={ButtonVariant.Secondary} onClick={() => setKeyRename(null)}>
              {t('inspector.renameKey.keep', { key: keyRename?.from ?? '' })}
            </Button>
            <Button
              variant={ButtonVariant.Primary}
              onClick={() => {
                if (keyRename !== null) {
                  apply(
                    renameKey(
                      useFlowBuilderStore.getState().document,
                      keyRename.nodeId,
                      keyRename.to,
                    ),
                  );
                }
                setKeyRename(null);
              }}
            >
              {t('inspector.renameKey.confirm')}
            </Button>
          </>
        }
      />
    </>
  );
}
