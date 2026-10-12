import { ModelProviderKind } from '@agent-ic/flow';
import type { ModelRef } from '@agent-ic/flow';
import { LLM_DEFAULT_MODEL } from '@/platform/llm/constants/llm-catalog.constants';
import { LlmPurpose } from '@/platform/llm/constants/llm-model.constants';

export const EXAMPLE_COLUMN_WIDTH = 300;
export const EXAMPLE_ROW_HEIGHT = 170;
export const EXAMPLE_TRIGGER_KEY = 'customer_message';
export const EXAMPLE_TRIGGER_LABEL = 'Customer message';
export const EXAMPLE_FALLBACK_MESSAGE = 'Sorry, nobody is free right now. We will write back soon.';
export const EXAMPLE_HAND_OFF_MESSAGE = 'A person from the team will answer you soon.';
export const EXAMPLE_VERSION_NOTE = 'First version';

export const EXAMPLE_AGENT_MODEL: ModelRef = {
  provider: { kind: ModelProviderKind.Platform },
  model: LLM_DEFAULT_MODEL[LlmPurpose.Conversation],
};

export const EXAMPLE_COMPLETION_MODEL: ModelRef = {
  provider: { kind: ModelProviderKind.Platform },
  model: LLM_DEFAULT_MODEL[LlmPurpose.Light],
};
