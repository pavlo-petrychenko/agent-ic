import { ReasoningLevel } from '@agent-ic/contracts';
import { NodeType } from '@agent-ic/flow';
import type { LlmStepType } from '@/features/flow-builder/typedefs/llmStep.typedefs';
import {
  ModelPurpose,
  ReasoningLevel as ApiReasoningLevel,
} from '@/shared/api/generated/schema.generated';

export const REASONING_FROM_API: Readonly<Record<ApiReasoningLevel, ReasoningLevel>> = {
  [ApiReasoningLevel.None]: ReasoningLevel.None,
  [ApiReasoningLevel.Low]: ReasoningLevel.Low,
  [ApiReasoningLevel.Medium]: ReasoningLevel.Medium,
  [ApiReasoningLevel.High]: ReasoningLevel.High,
  [ApiReasoningLevel.Xhigh]: ReasoningLevel.XHigh,
  [ApiReasoningLevel.Max]: ReasoningLevel.Max,
};

export const LLM_STEP_TYPES: readonly LlmStepType[] = [NodeType.Agent, NodeType.Completion];

export const STEP_MODEL_PURPOSE: Readonly<Record<LlmStepType, ModelPurpose>> = {
  [NodeType.Agent]: ModelPurpose.Conversation,
  [NodeType.Completion]: ModelPurpose.Light,
};

export const UNSET_OPTION = '';
export const NEW_OUTPUT_FIELD_PREFIX = 'field';
export const NEW_OUTPUT_FIELD_SEPARATOR = '_';
export const NEW_ENUM_VALUE = 'option_1';
