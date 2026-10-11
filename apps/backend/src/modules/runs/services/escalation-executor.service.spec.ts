import { EscalationMode, renderTemplate } from '@agent-ic/flow';
import type { EscalationNode } from '@agent-ic/flow';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import type { MockInstance } from 'vitest';
import {
  ConversationMode,
  ConversationState,
  needsOperatorEvent,
  outboundQueuedEvent,
} from '@/modules/conversations';
import { runEscalatedEvent } from '@/modules/runs/events/run-escalated.event';
import { EscalationExecutor } from '@/modules/runs/services/escalation-executor.service';
import { DomainEventsService } from '@/platform/domain-events/services/domain-events.service';
import { TEST_MESSAGE_TEXT } from '@test/support/constants/conversations-testing.constants';
import {
  ESCALATION_NODE_ID,
  ESCALATION_NODE_KEY,
  TEST_CUSTOMER_NOTICE,
  TEST_ESCALATION_REASON,
} from '@test/support/constants/runs-testing.constants';
import { TestRedisPrefix } from '@test/support/constants/test-infrastructure.constants';
import { endNode, escalateNode, triggerOnlyFlow } from '@test/support/fixtures/runs.fixture';
import {
  createRunsTestbed,
  readRunChat,
  seedExecutableRun,
  seedSimulationRun,
  stepExecutionOf,
} from '@test/support/helpers/runs-testing.helpers';
import type { RunExecutionTestbed } from '@test/support/typedefs/runs-testing.typedefs';

const rendered = (template: string): string => renderTemplate(template, () => TEST_MESSAGE_TEXT);

describe('EscalationExecutor', () => {
  let testbed: RunExecutionTestbed;
  let executor: EscalationExecutor;
  let emit: MockInstance<DomainEventsService['emit']>;

  const executionFor = async (node: EscalationNode) => {
    const seeded = await seedExecutableRun(testbed, triggerOnlyFlow());
    return stepExecutionOf(testbed, seeded, node, { message: { text: TEST_MESSAGE_TEXT } });
  };

  const emitted = (event: unknown) =>
    emit.mock.calls.filter(([, called]) => called === event).map(([, , data]) => data);

  beforeAll(async () => {
    testbed = await createRunsTestbed(TestRedisPrefix.RunEscalation);
    executor = testbed.module.get(EscalationExecutor);
    emit = vi.spyOn(testbed.module.get(DomainEventsService), 'emit');
  });

  afterEach(() => {
    emit.mockClear();
  });

  afterAll(async () => {
    emit.mockRestore();
    await testbed.module.close();
  });

  it('sends the text and leaves the conversation waiting, with events that carry the mode', async () => {
    const execution = await executionFor(escalateNode());

    const outcome = await executor.execute(execution);

    const chat = await readRunChat(testbed, execution.run, outcome.output['messageIds']);
    expect(outcome).toEqual({
      port: null,
      output: {
        mode: EscalationMode.Escalate,
        messageIds: [expect.any(String)],
        reason: rendered(TEST_ESCALATION_REASON),
      },
    });
    expect(chat.conversation?.state).toBe(ConversationState.Waiting);
    expect(chat.messages.map((message) => message?.text)).toEqual([rendered(TEST_CUSTOMER_NOTICE)]);
    expect(emitted(needsOperatorEvent)).toMatchObject([{ mode: ConversationMode.Live }]);
    expect(emitted(runEscalatedEvent)).toMatchObject([
      { runId: execution.run.id, nodeId: ESCALATION_NODE_ID, mode: ConversationMode.Live },
    ]);
  });

  it('neither sends nor notifies twice when a retried escalation runs again', async () => {
    const execution = await executionFor(escalateNode());

    const first = await executor.execute(execution);
    const retried = await executor.execute(execution);

    expect(retried).toEqual(first);
    expect(emitted(outboundQueuedEvent)).toHaveLength(1);
    expect(emitted(needsOperatorEvent)).toHaveLength(1);
    expect(emitted(runEscalatedEvent)).toHaveLength(1);
  });

  it('names who would be notified in a simulation, without notifying anyone', async () => {
    const seeded = await seedSimulationRun(testbed);
    const execution = await stepExecutionOf(testbed, seeded, escalateNode(), {});

    const outcome = await executor.execute(execution);

    expect(outcome.output['wouldNotify']).toEqual([]);
    expect(emitted(needsOperatorEvent)).toEqual([]);
    expect(emitted(runEscalatedEvent)).toMatchObject([{ mode: ConversationMode.Simulation }]);
  });

  it('sends the text and closes the conversation when the step ends the chat', async () => {
    const node = endNode(ESCALATION_NODE_ID, ESCALATION_NODE_KEY);
    const execution = await executionFor({
      ...node,
      config: { mode: EscalationMode.End, customerMessage: TEST_CUSTOMER_NOTICE },
    });

    const outcome = await executor.execute(execution);

    const chat = await readRunChat(testbed, execution.run, outcome.output['messageIds']);
    expect(outcome.port).toBeNull();
    expect(chat.conversation?.state).toBe(ConversationState.Closed);
    expect(chat.messages.map((message) => message?.text)).toEqual([rendered(TEST_CUSTOMER_NOTICE)]);
    expect(emitted(needsOperatorEvent)).toEqual([]);
  });
});
