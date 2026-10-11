import { MAX_LABEL_LENGTH, NodeType, isTriggerNode, triggerVariables } from '@agent-ic/flow';
import type { FlowNode } from '@agent-ic/flow';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { EMPTY_SELECTION } from '@/features/flow-builder/constants/flowBuilder.constants';
import { FLOW_BUILDER_NAMESPACE } from '@/features/flow-builder/constants/flowBuilderI18n.constants';
import { DESCRIBED_NODE_TYPES } from '@/features/flow-builder/constants/inspector.constants';
import { NODE_PRESENTATION } from '@/features/flow-builder/constants/nodePresentation.constants';
import { renameKey } from '@/features/flow-builder/logic/helpers/graphEdit.helpers';
import {
  fieldRows,
  nodeName,
  proposeKeyRename,
  updateNode,
} from '@/features/flow-builder/logic/helpers/inspector.helpers';
import { useFlowBuilderStore } from '@/features/flow-builder/storage/hooks/useFlowBuilderStore';
import type { KeyRename } from '@/features/flow-builder/typedefs/inspector.typedefs';
import { InlineEditField } from '@/features/flow-builder/view/InlineEditField';
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
  const [keyRename, setKeyRename] = useState<KeyRename | null>(null);
  const [nodeId] = selection.nodeIds.length === 1 ? selection.nodeIds : [null];
  const node = document.nodes.find((candidate) => candidate.id === nodeId) ?? null;
  const stepName = (type: NodeType) => t(`step.${type}`);

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
      default:
        return null;
    }
  };

  if (node === null) {
    return null;
  }

  const name = nodeName(node, stepName);
  const described = DESCRIBED_NODE_TYPES.find((type) => type === node.type) ?? null;
  const presentation = NODE_PRESENTATION[node.type];

  return (
    <>
      <Inspector
        kind={{
          label: isTriggerNode(node) ? t('inspector.trigger.kind') : stepName(node.type),
          ...presentation,
        }}
        title={name}
        subtitle={described === null ? null : t(`inspector.description.${described}`)}
        heading={
          <InlineEditField
            key={node.id}
            value={node.label === '' ? null : node.label}
            placeholder={name}
            editLabel={t('inspector.rename')}
            inputLabel={t('inspector.nameLabel')}
            maxLength={MAX_LABEL_LENGTH}
            required={false}
            current={false}
            inheritFont
            onCommit={(label) => {
              const renamed = updateNode(document, node.id, (step) => ({ ...step, label }));
              apply(renamed);
              setKeyRename(proposeKeyRename(renamed, node.id, label));
            }}
          />
        }
        closeLabel={t('inspector.close')}
        onClose={() => select(EMPTY_SELECTION)}
      >
        {body(node)}
      </Inspector>
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
