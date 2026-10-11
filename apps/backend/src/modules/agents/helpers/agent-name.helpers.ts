import { AGENT_NAME_MAX_LENGTH } from '@agent-ic/contracts';
import { DUPLICATE_AGENT_NAME_SUFFIX } from '@/modules/agents/constants/agent-input.constants';

export const duplicateAgentName = (name: string): string =>
  `${name.slice(0, AGENT_NAME_MAX_LENGTH - DUPLICATE_AGENT_NAME_SUFFIX.length)}${DUPLICATE_AGENT_NAME_SUFFIX}`;
