import { ConversationMode } from '@/modules/conversations';
import { RunStatus, RunTrigger } from '@/modules/runs/constants/run.constants';
import type { NewRun } from '@/modules/runs/typedefs/run.typedefs';
import { RUNS_TEST_START } from '@test/support/constants/runs-testing.constants';
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
