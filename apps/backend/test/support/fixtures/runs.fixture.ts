import { ConversationMode } from '@/modules/conversations';
import { ROOT_BRANCH_KEY, RunStatus, RunTrigger } from '@/modules/runs/constants/run.constants';
import type { NewRunStep } from '@/modules/runs/typedefs/run-step.typedefs';
import type { NewRun } from '@/modules/runs/typedefs/run.typedefs';
import {
  RUNS_TEST_START,
  TEST_STEP_INPUT,
  TEST_STEP_NODE_ID,
  TEST_STEP_NODE_KEY,
} from '@test/support/constants/runs-testing.constants';
import type { RunsTestbed } from '@test/support/typedefs/runs-testing.typedefs';

export const newRun = (testbed: RunsTestbed, workspaceId: string): NewRun => ({
  id: testbed.ids.generate(),
  workspaceId,
  conversationId: testbed.ids.generate(),
  agentId: testbed.ids.generate(),
  versionId: testbed.ids.generate(),
  mode: ConversationMode.Live,
  trigger: RunTrigger.Message,
  status: RunStatus.Queued,
  lastCoveredMessageId: testbed.ids.generate(),
  createdAt: RUNS_TEST_START,
});

export const newRunStep = (
  testbed: RunsTestbed,
  run: NewRun,
  overrides: Partial<NewRunStep> = {},
): NewRunStep => ({
  id: testbed.ids.generate(),
  workspaceId: run.workspaceId,
  runId: run.id,
  nodeId: TEST_STEP_NODE_ID,
  nodeKey: TEST_STEP_NODE_KEY,
  branchKey: ROOT_BRANCH_KEY,
  input: TEST_STEP_INPUT,
  startedAt: RUNS_TEST_START,
  ...overrides,
});
