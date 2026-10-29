import { WorkspaceRole } from '@agent-ic/contracts';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  ConversationMode,
  ConversationState,
} from '@/modules/conversations/constants/conversation.constants';
import { ConversationClosedError } from '@/modules/conversations/errors/conversation-closed.error';
import { ConversationNotFoundError } from '@/modules/conversations/errors/conversation-not-found.error';
import { HandBackUseCase } from '@/modules/conversations/use-cases/hand-back.use-case';
import { ReplyAsOperatorUseCase } from '@/modules/conversations/use-cases/reply-as-operator.use-case';
import { RestartSimulationUseCase } from '@/modules/conversations/use-cases/restart-simulation.use-case';
import { PermissionDeniedError } from '@/platform/context/errors/permission-denied.error';
import { AGENT_REPLY_TEXT } from '@test/support/constants/conversations-testing.constants';
import { workspaceCtx } from '@test/support/fixtures/workspace.fixture';
import {
  createConversationsTestbed,
  queuedEventsFor,
} from '@test/support/helpers/conversations-testing.helpers';
import { startTestSimulation } from '@test/support/helpers/simulator-testing.helpers';
import { armOnHandedBack } from '@test/support/jobs/conversation-probe.job';
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
    expect(await queuedEventsFor(testbed, armOnHandedBack, started.conversationId)).toEqual([
      {
        conversationId: started.conversationId,
        agentId: stored?.agentId,
        mode: ConversationMode.Simulation,
      },
    ]);
  });

  it('announces nothing when the conversation is already with the agent', async () => {
    const { ctx, conversationId, simulation } = await startTestSimulation(testbed);

    await testbed.module
      .get(HandBackUseCase)
      .execute(ctx, { conversationId: simulation.conversation.id });

    expect(await queuedEventsFor(testbed, armOnHandedBack, conversationId)).toEqual([]);
  });

  it('refuses an Operator, another Builder, another workspace and a closed simulation', async () => {
    const { ctx, workspaceId, publicAgentId, simulation } = await startTestSimulation(testbed);
    const handBack = testbed.module.get(HandBackUseCase);
    const input = { conversationId: simulation.conversation.id };

    await expect(
      handBack.execute({ ...ctx, workspaceRole: WorkspaceRole.Operator }, input),
    ).rejects.toBeInstanceOf(PermissionDeniedError);
    await expect(
      handBack.execute(
        workspaceCtx(testbed.ids.generate(), workspaceId, WorkspaceRole.Builder),
        input,
      ),
    ).rejects.toBeInstanceOf(ConversationNotFoundError);
    await expect(
      handBack.execute({ ...ctx, workspaceId: testbed.ids.generate() }, input),
    ).rejects.toBeInstanceOf(ConversationNotFoundError);
    await testbed.module.get(RestartSimulationUseCase).execute(ctx, { agentId: publicAgentId });
    await expect(handBack.execute(ctx, input)).rejects.toBeInstanceOf(ConversationClosedError);
  });
});
