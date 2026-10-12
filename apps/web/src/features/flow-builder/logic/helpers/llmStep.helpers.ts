import { ModelProviderKind, NodeType, OutputFieldType, nodeOutputFields } from '@agent-ic/flow';
import type { FlowDocument, ModelRef, OutputField } from '@agent-ic/flow';
import {
  CHOOSABLE_MODEL_SOURCE,
  NEW_ENUM_VALUE,
  NEW_OUTPUT_FIELD_PREFIX,
  NEW_OUTPUT_FIELD_SEPARATOR,
  STEP_MODEL_PURPOSE,
} from '@/features/flow-builder/constants/llmStep.constants';
import { updateNode } from '@/features/flow-builder/logic/helpers/inspector.helpers';
import type {
  LlmStepConfigPatch,
  LlmStepType,
  ModelChoice,
  OutputFieldPatch,
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

export const setRetries = (document: FlowDocument, nodeId: string, retries: number): FlowDocument =>
  updateNode(document, nodeId, (node) =>
    node.type === NodeType.Agent ? { ...node, config: { ...node.config, retries } } : node,
  );

export const setIncludeCurrentMessage = (
  document: FlowDocument,
  nodeId: string,
  includeCurrentMessage: boolean,
): FlowDocument =>
  updateNode(document, nodeId, (node) =>
    node.type === NodeType.Completion
      ? { ...node, config: { ...node.config, input: { includeCurrentMessage } } }
      : node,
  );

export const modelsForStep = (
  models: readonly ModelChoice[],
  type: LlmStepType,
): readonly ModelChoice[] =>
  models.filter(
    (model) =>
      model.source === CHOOSABLE_MODEL_SOURCE && model.purposes.includes(STEP_MODEL_PURPOSE[type]),
  );

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

const withOutput = (
  document: FlowDocument,
  nodeId: string,
  change: (output: readonly OutputField[]) => OutputField[],
): FlowDocument => {
  const node = document.nodes.find((candidate) => candidate.id === nodeId);
  return node?.type === NodeType.Agent || node?.type === NodeType.Completion
    ? updateLlmStep(document, nodeId, { output: change(node.config.output) })
    : document;
};

export const addOutputField = (document: FlowDocument, nodeId: string): FlowDocument => {
  const node = document.nodes.find((candidate) => candidate.id === nodeId);
  const taken = new Set(
    (node === undefined ? [] : nodeOutputFields(node)).map((field) => field.name),
  );
  let number = 1;
  while (taken.has(`${NEW_OUTPUT_FIELD_PREFIX}${NEW_OUTPUT_FIELD_SEPARATOR}${number}`)) {
    number += 1;
  }
  const field: OutputField = {
    name: `${NEW_OUTPUT_FIELD_PREFIX}${NEW_OUTPUT_FIELD_SEPARATOR}${number}`,
    type: OutputFieldType.String,
    description: '',
    required: true,
  };
  return withOutput(document, nodeId, (output) => [...output, field]);
};

const patchField = (field: OutputField, { name, type, values }: OutputFieldPatch): OutputField => {
  const base = {
    name: name ?? field.name,
    description: field.description,
    required: field.required,
  };
  const nextType = type ?? field.type;
  if (nextType !== OutputFieldType.Enum) {
    return { ...base, type: nextType };
  }
  const current = field.type === OutputFieldType.Enum ? field.values : [NEW_ENUM_VALUE];
  return { ...base, type: nextType, values: values === undefined ? current : [...values] };
};

export const updateOutputField = (
  document: FlowDocument,
  nodeId: string,
  index: number,
  patch: OutputFieldPatch,
): FlowDocument =>
  withOutput(document, nodeId, (output) =>
    output.map((field, position) => (position === index ? patchField(field, patch) : field)),
  );

export const removeOutputField = (
  document: FlowDocument,
  nodeId: string,
  index: number,
): FlowDocument =>
  withOutput(document, nodeId, (output) => output.filter((_, position) => position !== index));
