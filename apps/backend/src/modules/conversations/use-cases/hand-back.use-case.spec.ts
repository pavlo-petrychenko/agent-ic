import { WorkspaceRole } from '@agent-ic/contracts';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ConversationState } from '@/modules/conversations/constants/conversation.constants';
import { ConversationClosedError } from '@/modules/conversations/errors/conversation-closed.error';
import { HandBackUseCase } from '@/modules/conversations/use-cases/hand-back.use-case';
import { ReplyAsOperatorUseCase } from '@/modules/conversations/use-cases/reply-as-operator.use-case';
import { RestartSimulationUseCase } from '@/modules/conversations/use-cases/restart-simulation.use-case';
import { PermissionDeniedError } from '@/platform/context/errors/permission-denied.error';
import { AGENT_REPLY_TEXT } from '@test/support/constants/conversations-testing.constants';
import { createConversationsTestbed } from '@test/support/helpers/conversations-testing.helpers';
import { startTestSimulation } from '@test/support/helpers/simulator-testing.helpers';
import type { ConversationsTestbed } from '@test/support/typedefs/conversations-testing.typedefs';

describe('HandBackUseCase', () => {
  let testbed: ConversationsTestbed;

  beforeAll(async () => {
    testbed = await createConversationsTestbed();
  });

  afterAll(async () => {
    await testbed.module.close();
  });

  it('gives a handled simulation back to the agent', async () => {
    const started = await startTestSimulation(testbed);
    const { workspaceId, ctx } = started;
    const conversationId = started.simulation.conversation.id;
    await testbed.module
      .get(ReplyAsOperatorUseCase)
      .execute(ctx, { conversationId, text: AGENT_REPLY_TEXT });

    const handedBack = await testbed.module.get(HandBackUseCase).execute(ctx, { conversationId });

    const stored = await testbed.tenants.run(workspaceId, () =>
      testbed.conversations.findById(workspaceId, started.conversationId),
    );
    expect(handedBack.state).toBe(ConversationState.AgentActive);
    expect(stored).toMatchObject({ state: ConversationState.AgentActive, handledBy: null });
  });

  it('refuses an Operator and a closed simulation', async () => {
    const { ctx, publicAgentId, simulation } = await startTestSimulation(testbed);
    const handBack = testbed.module.get(HandBackUseCase);
    const input = { conversationId: simulation.conversation.id };

    await expect(
      handBack.execute({ ...ctx, workspaceRole: WorkspaceRole.Operator }, input),
    ).rejects.toBeInstanceOf(PermissionDeniedError);
    await testbed.module.get(RestartSimulationUseCase).execute(ctx, { agentId: publicAgentId });
    await expect(handBack.execute(ctx, input)).rejects.toBeInstanceOf(ConversationClosedError);
  });
});
