import { LlmPurpose } from '@/platform/llm/constants/llm-model.constants';

export enum LlmStepTraceName {
  Completion = 'runs.completion',
}

export const COMPLETION_PURPOSE = LlmPurpose.Light;

export const NO_HISTORY_MESSAGE = 'There are no earlier messages in this conversation.';
