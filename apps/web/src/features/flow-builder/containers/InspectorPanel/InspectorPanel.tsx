import {
  API_REQUEST_OUTPUTS,
  MAX_LABEL_LENGTH,
  MAX_OUTPUT_FIELDS,
  MAX_ROUTER_RULES,
  MessageContentKind,
  NodeType,
  PortName,
  PromptSourceKind,
  QuickRepliesKind,
  nodeOutputFields,
  triggerVariables,
  visibleVariables,
} from '@agent-ic/flow';
import type { AgentNode, CompletionNode, FlowNode } from '@agent-ic/flow';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMembersByRole } from '@/features/flow-builder/communication/hooks/useMembersByRole';
import { useModelOptions } from '@/features/flow-builder/communication/hooks/useModelOptions';
import { useTestApiRequest } from '@/features/flow-builder/communication/hooks/useTestApiRequest';
import { EMPTY_SELECTION } from '@/features/flow-builder/constants/flowBuilder.constants';
import { FLOW_BUILDER_NAMESPACE } from '@/features/flow-builder/constants/flowBuilderI18n.constants';
import {
  DESCRIBED_NODE_TYPES,
  IssuePathSegment,
  PATH_JOINER,
} from '@/features/flow-builder/constants/inspector.constants';
import { LLM_STEP_TYPES } from '@/features/flow-builder/constants/llmStep.constants';
import { NODE_PRESENTATION } from '@/features/flow-builder/constants/nodePresentation.constants';
import { SaveState } from '@/features/flow-builder/constants/saveState.constants';
import type { InspectorPanelProps } from '@/features/flow-builder/containers/InspectorPanel/InspectorPanel.typedefs';
import { updateApiRequest } from '@/features/flow-builder/logic/helpers/apiRequest.helpers';
import {
  recipientsValue,
  setChannel,
  setCustomerMessage,
  setEscalationMode,
  setRecipients,
  updateEscalate,
} from '@/features/flow-builder/logic/helpers/escalation.helpers';
import { renameKey } from '@/features/flow-builder/logic/helpers/graphEdit.helpers';
import { newElementId } from '@/features/flow-builder/logic/helpers/id.helpers';
import {
  branchRows,
  conditionPath,
  fieldErrors,
  fieldRows,
  nodeName,
  observerNames,
  portTargets,
  proposeKeyRename,
  rulePath,
  updateNode,
} from '@/features/flow-builder/logic/helpers/inspector.helpers';
import {
  addOutputField,
  modelsForStep,
  removeOutputField,
  selectModel,
  setCompletionRole,
  setIncludeCurrentMessage,
  setRetries,
  updateLlmStep,
  updateOutputField,
} from '@/features/flow-builder/logic/helpers/llmStep.helpers';
import {
  addRule,
  conditionView,
  moveRule,
  renameRule,
  removeRule,
  updateCondition,
} from '@/features/flow-builder/logic/helpers/router.helpers';
import {
  contentOfKind,
  listVariables,
  quickRepliesOfKind,
  replaceButton,
  updateSendMessage,
} from '@/features/flow-builder/logic/helpers/sendMessage.helpers';
import { useFlowIssues } from '@/features/flow-builder/logic/hooks/useFlowIssues';
import { useFlowBuilderStore } from '@/features/flow-builder/storage/hooks/useFlowBuilderStore';
import type { KeyRename } from '@/features/flow-builder/typedefs/inspector.typedefs';
import type { LlmStepExtra } from '@/features/flow-builder/typedefs/llmStep.typedefs';
import { ApiRequestInspector } from '@/features/flow-builder/view/ApiRequestInspector';
import { EscalationInspector } from '@/features/flow-builder/view/EscalationInspector';
import { InlineEditField } from '@/features/flow-builder/view/InlineEditField';
import { LlmStepInspector } from '@/features/flow-builder/view/LlmStepInspector';
import { ParallelInspector } from '@/features/flow-builder/view/ParallelInspector';
import { RouterInspector } from '@/features/flow-builder/view/RouterInspector';
import { SendMessageInspector } from '@/features/flow-builder/view/SendMessageInspector';
import { TriggerInspector } from '@/features/flow-builder/view/TriggerInspector';
import { Button, ButtonVariant } from '@/shared/ui/actions/Button';
import { Inspector } from '@/shared/ui/layout/Inspector';
import { Dialog } from '@/shared/ui/overlays/Dialog';

export function InspectorPanel({ agentId }: InspectorPanelProps) {
  const { t } = useTranslation(FLOW_BUILDER_NAMESPACE);
  const document = useFlowBuilderStore((state) => state.document);
  const selection = useFlowBuilderStore((state) => state.selection);
  const apply = useFlowBuilderStore((state) => state.apply);
  const previewEdit = useFlowBuilderStore((state) => state.previewEdit);
  const select = useFlowBuilderStore((state) => state.select);
  const issues = useFlowIssues();
  const [keyRename, setKeyRename] = useState<KeyRename | null>(null);
  const [nodeId] = selection.nodeIds.length === 1 ? selection.nodeIds : [null];
  const node = document.nodes.find((candidate) => candidate.id === nodeId) ?? null;
  const variables = useMemo(
    () => (node === null ? [] : visibleVariables(document, node.id)),
    [document, node],
  );
  const modelOptions = useModelOptions(!LLM_STEP_TYPES.some((type) => type === node?.type));
  const saveState = useFlowBuilderStore((state) => state.saveState);
  const apiTest = useTestApiRequest(agentId);
  const memberCounts = useMembersByRole(node?.type !== NodeType.Escalation);
  const variableOptions = useMemo(
    () =>
      variables.map((variable) => {
        const source = document.nodes.find((candidate) => candidate.id === variable.nodeId);
        return {
          id: variable.path,
          label: variable.path,
          group:
            source === undefined ? t(`inspector.llm.source.${variable.source}`) : nodeName(source),
        };
      }),
    [document, variables, t],
  );

  const commitPreview = useCallback(() => apply(useFlowBuilderStore.getState().document), [apply]);

  const llmStep = (current: AgentNode | CompletionNode, extra: LlmStepExtra) => {
    const errors = fieldErrors(issues, current.id);
    const { prompt, model, reasoning, output } = current.config;
    const text = prompt?.kind === PromptSourceKind.Inline ? prompt.text : '';
    const builtIn = nodeOutputFields(current).filter((field) => !output.includes(field));
    return (
      <LlmStepInspector
        key={current.id}
        step={{
          prompt: text,
          variables: variableOptions,
          models: modelsForStep(modelOptions.models, current.type),
          modelsLoading: modelOptions.loading,
          modelsFailed: modelOptions.error !== null,
          model: model?.model ?? null,
          reasoning,
          builtIn,
          output,
          promptIssue:
            errors.get(IssuePathSegment.Prompt) ??
            errors.get([IssuePathSegment.Prompt, IssuePathSegment.Text].join(PATH_JOINER)) ??
            null,
          modelIssue: errors.get(IssuePathSegment.Model) ?? null,
          fieldIssues: output.map(
            (_, index) =>
              errors.get(
                [IssuePathSegment.Output, index, IssuePathSegment.Name].join(PATH_JOINER),
              ) ?? null,
          ),
          canAddField: output.length < MAX_OUTPUT_FIELDS,
          canRemoveField: current.type === NodeType.Agent || output.length > 1,
        }}
        extra={extra}
        onPromptChange={(next) =>
          next !== text &&
          previewEdit(
            updateLlmStep(document, current.id, {
              prompt: { kind: PromptSourceKind.Inline, text: next },
            }),
          )
        }
        onPromptCommit={commitPreview}
        onModelChange={(modelId) =>
          apply(selectModel(document, current.id, modelOptions.models, modelId))
        }
        onRetryModels={modelOptions.retry}
        onReasoningChange={(level) =>
          apply(updateLlmStep(document, current.id, { reasoning: level }))
        }
        onAddField={() => apply(addOutputField(document, current.id))}
        onFieldChange={(index, patch) =>
          apply(updateOutputField(document, current.id, index, patch))
        }
        onRemoveField={(index) => apply(removeOutputField(document, current.id, index))}
      />
    );
  };

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
      case NodeType.Agent:
        return llmStep(current, {
          type: NodeType.Agent,
          retries: current.config.retries,
          onFailure: portTargets(document, current.id, PortName.Error),
          onRetriesChange: (retries) => apply(setRetries(document, current.id, retries)),
        });
      case NodeType.Completion:
        return llmStep(current, {
          type: NodeType.Completion,
          role: current.config.role,
          includeCurrentMessage: current.config.input.includeCurrentMessage,
          onRoleChange: (role) => apply(setCompletionRole(document, current.id, role)),
          onIncludeCurrentMessageChange: (include) =>
            apply(setIncludeCurrentMessage(document, current.id, include)),
        });
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
      case NodeType.Router: {
        const errors = fieldErrors(issues, current.id);
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
            ruleError={(rule, segment) => errors.get(rulePath(rule, segment)) ?? null}
            conditionError={(rule, condition, segment) =>
              errors.get(conditionPath(rule, condition, segment)) ?? null
            }
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
      }
      case NodeType.SendMessage: {
        const errors = fieldErrors(issues, current.id);
        const lists = listVariables(variables);
        const { content, quickReplies } = current.config;
        const contentPath = (segment: IssuePathSegment) =>
          [IssuePathSegment.Content, segment].join(PATH_JOINER);
        const update = (patch: Parameters<typeof updateSendMessage>[2]) =>
          apply(updateSendMessage(document, current.id, patch));
        return (
          <SendMessageInspector
            key={current.id}
            config={current.config}
            variables={variableOptions}
            lists={lists}
            contentIssue={
              errors.get(contentPath(IssuePathSegment.Text)) ??
              errors.get(contentPath(IssuePathSegment.Variable)) ??
              null
            }
            buttonsIssue={
              errors.get(
                [IssuePathSegment.QuickReplies, IssuePathSegment.Variable].join(PATH_JOINER),
              ) ?? null
            }
            onChange={update}
            onTextChange={(text) =>
              previewEdit(
                updateSendMessage(document, current.id, {
                  content: { kind: MessageContentKind.Text, text },
                }),
              )
            }
            onCommit={commitPreview}
            onContentKindChange={(kind) =>
              kind !== content.kind && update({ content: contentOfKind(kind, lists) })
            }
            onButtonsKindChange={(kind) =>
              kind !== quickReplies.kind &&
              update({
                quickReplies: quickRepliesOfKind(kind, lists, t('inspector.send.newButton')),
              })
            }
            onButtonChange={(index, label) =>
              quickReplies.kind === QuickRepliesKind.Static &&
              update({
                quickReplies: {
                  ...quickReplies,
                  buttons: replaceButton(quickReplies.buttons, index, label),
                },
              })
            }
          />
        );
      }
      case NodeType.Escalation: {
        const errors = fieldErrors(issues, current.id);
        return (
          <EscalationInspector
            key={current.id}
            config={current.config}
            variables={variableOptions}
            recipients={recipientsValue(current.config)}
            counts={memberCounts}
            issue={(path) => errors.get(path) ?? null}
            onModeChange={(mode) => apply(setEscalationMode(document, current.id, mode))}
            onMessageChange={(text) => previewEdit(setCustomerMessage(document, current.id, text))}
            onTemplateChange={(patch) => previewEdit(updateEscalate(document, current.id, patch))}
            onCommit={commitPreview}
            onRecipientsChange={(value) => apply(setRecipients(document, current.id, value))}
            onChannelChange={(channel, on) => apply(setChannel(document, current.id, channel, on))}
          />
        );
      }
      case NodeType.ApiRequest: {
        const errors = fieldErrors(issues, current.id);
        const { config } = current;
        const update = (patch: Parameters<typeof updateApiRequest>[2]) =>
          apply(updateApiRequest(document, current.id, patch));
        return (
          <ApiRequestInspector
            key={current.id}
            config={config}
            outputs={API_REQUEST_OUTPUTS}
            variables={variableOptions}
            issue={(path) => errors.get(path) ?? null}
            test={apiTest.stateOf(current)}
            canTest={saveState === SaveState.Idle}
            onChange={update}
            onTemplateChange={(patch) => previewEdit(updateApiRequest(document, current.id, patch))}
            onCommit={commitPreview}
            onTest={() => apiTest.run(current)}
          />
        );
      }
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
