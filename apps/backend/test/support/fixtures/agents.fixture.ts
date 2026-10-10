import type { NewAgent } from '@/modules/agents/typedefs/agent.typedefs';
import {
  AGENTS_TEST_START,
  TEST_AGENT_NAME,
} from '@test/support/constants/agents-testing.constants';

export const newAgent = (
  id: string,
  workspaceId: string,
  overrides: Partial<NewAgent> = {},
): NewAgent => ({
  id,
  workspaceId,
  name: TEST_AGENT_NAME,
  createdAt: AGENTS_TEST_START,
  updatedAt: AGENTS_TEST_START,
  ...overrides,
});
