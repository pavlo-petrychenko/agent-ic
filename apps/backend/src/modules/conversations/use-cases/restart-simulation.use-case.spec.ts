import { IdPrefix, WorkspaceRole } from '@agent-ic/contracts';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ConversationState } from '@/modules/conversations/constants/conversation.constants';
import { ConversationNotFoundError } from '@/modules/conversations/errors/conversation-not-found.error';
import { RestartSimulationUseCase } from '@/modules/conversations/use-cases/restart-simulation.use-case';
import { PermissionDeniedError } from '@/platform/context/errors/permission-denied.error';
import { seedPublishedVersion } from '@test/support/helpers/agents-testing.helpers';
import { createConversationsTestbed } from '@test/support/helpers/conversations-testing.helpers';
import { startTestSimulation } from '@test/support/helpers/simulator-testing.helpers';
import type { ConversationsTestbed } from '@test/support/typedefs/conversations-testing.typedefs';

describe('RestartSimulationUseCase', () => {
  let testbed: ConversationsTestbed;

  beforeAll(async () => {
    testbed = await createConversationsTestbed();
  });

  afterAll(async () => {
    await testbed.module.close();
  });

  it('closes the simulation and opens a fresh one with the same setup', async () => {
    const started = await startTestSimulation(testbed, (agentId, workspaceId) =>
      seedPublishedVersion(testbed.module, workspaceId, agentId),
    );
    const { workspaceId, ctx, publicAgentId, simulation } = started;
    const restart = testbed.module.get(RestartSimulationUseCase);

    const fresh = await restart.execute(ctx, { agentId: publicAgentId });

    const before = await testbed.tenants.run(workspaceId, () =>
      testbed.conversations.findById(
        workspaceId,
        testbed.ids.fromPublic(IdPrefix.Conversation, simulation.conversation.id),
      ),
    );
    expect(before?.state).toBe(ConversationState.Closed);
    expect(fresh.conversation).toEqual({
      ...simulation.conversation,
      id: expect.not.stringMatching(simulation.conversation.id),
    });
  });

  it('refuses an agent without an open simulation, and an operator', async () => {
    const { ctx, publicAgentId } = await startTestSimulation(testbed);
    const restart = testbed.module.get(RestartSimulationUseCase);
    const other = testbed.ids.toPublic(IdPrefix.Agent, testbed.ids.generate());

    await expect(restart.execute(ctx, { agentId: other })).rejects.toBeInstanceOf(
      ConversationNotFoundError,
    );
    await expect(
      restart.execute(
        { ...ctx, workspaceRole: WorkspaceRole.Operator },
        { agentId: publicAgentId },
      ),
    ).rejects.toBeInstanceOf(PermissionDeniedError);
  });
});
