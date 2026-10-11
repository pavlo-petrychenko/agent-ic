import { ModelProviderKind, NodeType } from '@agent-ic/flow';
import type { FlowDocument, ModelRef } from '@agent-ic/flow';
import { STEP_MODEL_PURPOSE } from '@/features/flow-builder/constants/llmStep.constants';
import { updateNode } from '@/features/flow-builder/logic/helpers/inspector.helpers';
import type {
  LlmStepConfigPatch,
  LlmStepType,
  ModelChoice,
} from '@/features/flow-builder/typedefs/llmStep.typedefs';

export const updateLlmStep = (
  document: FlowDocument,
  nodeId: string,
  patch: LlmStepConfigPatch,
): FlowDocument =>
  updateNode(document, nodeId, (node) => {
    if (node.type === NodeType.Agent) {
      return { ...node, config: { ...node.config, ...patch } };
    }
    return node.type === NodeType.Completion
      ? { ...node, config: { ...node.config, ...patch } }
      : node;
  });

export const modelsForStep = (
  models: readonly ModelChoice[],
  type: LlmStepType,
): readonly ModelChoice[] =>
  models.filter((model) => model.purposes.includes(STEP_MODEL_PURPOSE[type]));

export const selectModel = (
  document: FlowDocument,
  nodeId: string,
  models: readonly ModelChoice[],
  modelId: string,
): FlowDocument => {
  const node = document.nodes.find((candidate) => candidate.id === nodeId);
  const chosen = models.find((model) => model.id === modelId) ?? null;
  if (node === undefined || chosen === null) {
    return document;
  }
  const model: ModelRef = { provider: { kind: ModelProviderKind.Platform }, model: chosen.id };
  const reasoning =
    (node.type === NodeType.Agent || node.type === NodeType.Completion) &&
    node.config.reasoning !== null &&
    chosen.reasoningLevels.includes(node.config.reasoning)
      ? node.config.reasoning
      : null;
  return updateLlmStep(document, nodeId, { model, reasoning });
};
