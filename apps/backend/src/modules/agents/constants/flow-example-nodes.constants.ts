import { InactivityUnit, ModelProviderKind } from '@agent-ic/flow';
import type { AgentExits, InactivityDuration, ModelRef } from '@agent-ic/flow';
import { LLM_DEFAULT_MODEL } from '@/platform/llm/constants/llm-catalog.constants';
import { LlmPurpose } from '@/platform/llm/constants/llm-model.constants';

export const EXAMPLE_COLUMN_WIDTH = 300;
export const EXAMPLE_ROW_HEIGHT = 170;
export const EXAMPLE_TRIGGER_KEY = 'customer_message';
export const EXAMPLE_TRIGGER_LABEL = 'Customer message';
export const EXAMPLE_FALLBACK_MESSAGE = 'Sorry, nobody is free right now. We will write back soon.';
export const EXAMPLE_HAND_OFF_MESSAGE = 'A person from the team will answer you soon.';
export const EXAMPLE_VERSION_NOTE = 'First version';
export const EXAMPLE_INACTIVITY_KEY = 'customer_quiet';
export const EXAMPLE_INACTIVITY_LABEL = 'Customer went quiet';
export const EXAMPLE_INACTIVITY_MAX_TIMES = 2;

export const EXAMPLE_INACTIVITY_SILENCE: InactivityDuration = {
  amount: 2,
  unit: InactivityUnit.Hours,
};

export const EXAMPLE_INACTIVITY_REPEAT_EVERY: InactivityDuration = {
  amount: 22,
  unit: InactivityUnit.Hours,
};

export const EXAMPLE_AGENT_MODEL: ModelRef = {
  provider: { kind: ModelProviderKind.Platform },
  model: LLM_DEFAULT_MODEL[LlmPurpose.Conversation],
};

export const EXAMPLE_COMPLETION_MODEL: ModelRef = {
  provider: { kind: ModelProviderKind.Platform },
  model: LLM_DEFAULT_MODEL[LlmPurpose.Light],
};

export const EXAMPLE_HANDOFF_WHEN =
  'The customer asks for a person, you cannot help after two tries, or it is a complaint, a legal question or a safety issue.';
export const EXAMPLE_END_WHEN = 'The customer says goodbye or the request is done.';
export const EXAMPLE_AUTO_CLOSE_MINUTES = 1440;

export const EXAMPLE_HANDOFF_EXIT: AgentExits = {
  end: null,
  handoff: { when: EXAMPLE_HANDOFF_WHEN },
};

export const EXAMPLE_END_EXIT: AgentExits = {
  end: { when: EXAMPLE_END_WHEN },
  handoff: null,
};
