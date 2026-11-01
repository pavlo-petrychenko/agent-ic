import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { MessageAuthor } from '@/modules/conversations';
import { MessageRunService } from '@/modules/runs';
import { TestRedisPrefix } from '@test/support/constants/test-infrastructure.constants';
import { triggerOnlyFlow } from '@test/support/fixtures/runs.fixture';
import {
  addConversationMessage,
  createRunLifecycleTestbed,
  readLifecycle,
  seedLiveConversation,
} from '@test/support/helpers/runs-testing.helpers';
import type { RunLifecycleTestbed } from '@test/support/typedefs/runs-testing.typedefs';

describe('MessageRunService', () => {
  let testbed: RunLifecycleTestbed;

  beforeAll(async () => {
    testbed = await createRunLifecycleTestbed(TestRedisPrefix.RunStart);
  });

  afterAll(async () => {
    await testbed.module.close();
  });

  it('creates the run with the id supplied by the caller', async () => {
    const seeded = await seedLiveConversation(testbed, triggerOnlyFlow());
    const message = await addConversationMessage(testbed, seeded, MessageAuthor.Customer);
    const runId = testbed.ids.generate();

    const run = await testbed.tenants.run(seeded.conversation.workspaceId, () =>
      testbed.module.get(MessageRunService).start(seeded.ctx, {
        workspaceId: seeded.conversation.workspaceId,
        conversationId: seeded.conversation.id,
        messageId: message.id,
        agentId: seeded.conversation.agentId,
        mode: seeded.conversation.mode,
        versionId: seeded.versionId,
        runId,
      }),
    );

    const { latest } = await readLifecycle(testbed, seeded);
    expect(run?.id).toBe(runId);
    expect(latest?.id).toBe(runId);
  });
});
