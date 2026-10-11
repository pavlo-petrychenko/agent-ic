import { LlmPurpose } from '@/platform/llm/constants/llm-model.constants';

export enum LlmStepTraceName {
  Completion = 'runs.completion',
}

export const COMPLETION_PURPOSE = LlmPurpose.Light;

export const ANSWER_FROM_CONVERSATION_MESSAGE =
  'This note is from the system, not from the customer. Answer from the conversation so far.';
