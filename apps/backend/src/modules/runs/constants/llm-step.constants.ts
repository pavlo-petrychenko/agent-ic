import { LlmPurpose } from '@/platform/llm/constants/llm-model.constants';
import type { LlmTools } from '@/platform/llm/typedefs/llm-gateway.typedefs';

export enum LlmStepTraceName {
  Completion = 'runs.completion',
  Agent = 'runs.agent',
}

export const COMPLETION_PURPOSE = LlmPurpose.Light;
export const AGENT_PURPOSE = LlmPurpose.Conversation;
export const AGENT_MAX_TOOL_ROUNDS = 5;
export const AGENT_TOOLS: LlmTools = {};
export const AGENT_INCLUDES_CURRENT_MESSAGE = true;

export const ANSWER_FROM_CONVERSATION_MESSAGE =
  'This note is from the system, not from the customer. Answer from the conversation so far.';
