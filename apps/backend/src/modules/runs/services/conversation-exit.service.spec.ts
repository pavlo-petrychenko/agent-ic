import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import type { MockInstance } from 'vitest';
import {
  ConversationMode,
  ConversationState,
  needsOperatorEvent,
  outboundQueuedEvent,
} from '@/modules/conversations';
import { runEscalatedEvent } from '@/modules/runs/events/run-escalated.event';
import { ConversationExitService } from '@/modules/runs/services/conversation-exit.service';
import { DomainEventsService } from '@/platform/domain-events/services/domain-events.service';
import {
  ESCALATION_NODE_ID,
  TEST_CUSTOMER_NOTICE,
} from '@test/support/constants/runs-testing.constants';
import { TestRedisPrefix } from '@test/support/constants/test-infrastructure.constants';
import { escalateNode, triggerOnlyFlow } from '@test/support/fixtures/runs.fixture';
import {
  createRunsTestbed,
  readRunChat,
  seedExecutableRun,
  stepExecutionOf,
} from '@test/support/helpers/runs-testing.helpers';
import type { RunExecutionTestbed } from '@test/support/typedefs/runs-testing.typedefs';

describe('ConversationExitService', () => {
  let testbed: RunExecutionTestbed;
  let service: ConversationExitService;
  let emit: MockInstance<DomainEventsService['emit']>;

  const exitOf = async () => {
    const seeded = await seedExecutableRun(testbed, triggerOnlyFlow());
    const { ctx, run } = await stepExecutionOf(testbed, seeded, escalateNode(), {});
    return { ctx, run, nodeId: ESCALATION_NODE_ID, texts: [TEST_CUSTOMER_NOTICE] };
  };

  const emitted = (event: unknown) =>
    emit.mock.calls.filter(([, called]) => called === event).map(([, , data]) => data);

  beforeAll(async () => {
    testbed = await createRunsTestbed(TestRedisPrefix.RunConversationExit);
    service = testbed.module.get(ConversationExitService);
    emit = vi.spyOn(testbed.module.get(DomainEventsService), 'emit');
  });

  afterEach(() => {
    emit.mockClear();
  });

  afterAll(async () => {
    emit.mockRestore();
    await testbed.module.close();
  });

  it('sends the texts and closes the conversation when it ends', async () => {
    const exit = await exitOf();

    const messageIds = await testbed.tenants.run(exit.run.workspaceId, () => service.end(exit));

    const chat = await readRunChat(testbed, exit.run, messageIds);
    expect(chat.conversation?.state).toBe(ConversationState.Closed);
    expect(chat.messages).toHaveLength(1);
    expect(emitted(outboundQueuedEvent)).toHaveLength(1);
    expect(emitted(needsOperatorEvent)).toEqual([]);
    expect(emitted(runEscalatedEvent)).toEqual([]);
  });

  it('sends the texts, waits for an operator and announces it once when it hands off', async () => {
    const exit = await exitOf();

    const handOff = () => testbed.tenants.run(exit.run.workspaceId, () => service.handOff(exit));
    const messageIds = await handOff();
    await handOff();

    const chat = await readRunChat(testbed, exit.run, messageIds);
    expect(chat.conversation?.state).toBe(ConversationState.Waiting);
    expect(emitted(needsOperatorEvent)).toMatchObject([{ mode: ConversationMode.Live }]);
    expect(emitted(runEscalatedEvent)).toMatchObject([
      { runId: exit.run.id, nodeId: ESCALATION_NODE_ID, mode: ConversationMode.Live },
    ]);
  });
});
