import { PortName } from '@agent-ic/flow';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { MessageAuthor, outboundQueuedEvent } from '@/modules/conversations';
import { outboundMessageKey } from '@/modules/runs/helpers/outbound-message.helpers';
import { SendMessageExecutor } from '@/modules/runs/services/send-message-executor.service';
import { DomainEventsService } from '@/platform/domain-events/services/domain-events.service';
import {
  SEND_NODE_ID,
  TEST_QUICK_REPLIES,
  TEST_REPLIES,
  TEST_SENT_REPLIES,
} from '@test/support/constants/runs-testing.constants';
import { TestRedisPrefix } from '@test/support/constants/test-infrastructure.constants';
import { sendMessageNode, triggerOnlyFlow } from '@test/support/fixtures/runs.fixture';
import {
  createRunsTestbed,
  readRunChat,
  seedExecutableRun,
  stepExecutionOf,
} from '@test/support/helpers/runs-testing.helpers';
import type { RunExecutionTestbed } from '@test/support/typedefs/runs-testing.typedefs';

describe('SendMessageExecutor', () => {
  let testbed: RunExecutionTestbed;
  let executor: SendMessageExecutor;

  const sendReplies = async () => {
    const seeded = await seedExecutableRun(testbed, triggerOnlyFlow());
    const variables = { agent: { messages: TEST_REPLIES } };
    return stepExecutionOf(testbed, seeded, sendMessageNode(), variables);
  };

  beforeAll(async () => {
    testbed = await createRunsTestbed(TestRedisPrefix.RunMessages);
    executor = testbed.module.get(SendMessageExecutor);
  });

  afterAll(async () => {
    await testbed.module.close();
  });

  it('records one agent message per item, with the quick replies on the last one', async () => {
    const execution = await sendReplies();
    const { id: runId } = execution.run;

    const outcome = await executor.execute(execution);

    const { messages } = await readRunChat(testbed, execution.run, outcome.output['messageIds']);
    expect(messages).toEqual([
      expect.objectContaining({
        author: MessageAuthor.Agent,
        text: TEST_SENT_REPLIES[0],
        quickReplies: [],
        idempotencyKey: outboundMessageKey(runId, SEND_NODE_ID, 0),
        runId,
      }),
      expect.objectContaining({
        text: TEST_SENT_REPLIES[1],
        quickReplies: TEST_QUICK_REPLIES,
        idempotencyKey: outboundMessageKey(runId, SEND_NODE_ID, 1),
      }),
    ]);
    expect(outcome).toEqual({
      port: PortName.Next,
      output: { messageIds: expect.any(Array), typing: true, waitForDelivery: false },
    });
  });

  it('sends nothing twice when a retried step runs again', async () => {
    const execution = await sendReplies();
    const emit = vi.spyOn(testbed.module.get(DomainEventsService), 'emit');

    const first = await executor.execute(execution);
    const retried = await executor.execute(execution);

    const queued = emit.mock.calls.filter(([, event]) => event === outboundQueuedEvent);
    emit.mockRestore();
    expect(retried).toEqual(first);
    expect(queued).toHaveLength(TEST_SENT_REPLIES.length);
  });
});
