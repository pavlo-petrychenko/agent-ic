import { ErrorReason, IdPrefix, WorkspaceRole } from '@agent-ic/contracts';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  ChannelKind,
  ConversationState,
} from '@/modules/conversations/constants/conversation.constants';
import type { StartSimulationInput } from '@/modules/conversations/typedefs/simulation.typedefs';
import { StartSimulationUseCase } from '@/modules/conversations/use-cases/start-simulation.use-case';
import { PermissionDeniedError } from '@/platform/context/errors/permission-denied.error';
import { TEST_END_USER_LANGUAGE } from '@test/support/constants/conversations-testing.constants';
import { workspaceCtx } from '@test/support/fixtures/workspace.fixture';
import {
  deleteAgent,
  seedAgentWithDraft,
  seedPublishedVersion,
} from '@test/support/helpers/agents-testing.helpers';
import { createConversationsTestbed } from '@test/support/helpers/conversations-testing.helpers';
import type { ConversationsTestbed } from '@test/support/typedefs/conversations-testing.typedefs';

describe('StartSimulationUseCase', () => {
  let testbed: ConversationsTestbed;
  let userId: string;

  const seed = async (workspaceId = testbed.ids.generate()) => {
    const seeded = await seedAgentWithDraft(testbed.module, workspaceId);
    const input: StartSimulationInput = {
      agentId: testbed.ids.toPublic(IdPrefix.Agent, seeded.agentId),
      versionId: null,
      channelKind: ChannelKind.Simulated,
      language: TEST_END_USER_LANGUAGE,
    };
    return { ...seeded, workspaceId, input };
  };

  const start = (workspaceId: string, input: StartSimulationInput, role = WorkspaceRole.Builder) =>
    testbed.module
      .get(StartSimulationUseCase)
      .execute(workspaceCtx(userId, workspaceId, role), input);

  beforeAll(async () => {
    testbed = await createConversationsTestbed();
    userId = testbed.ids.generate();
  });

  afterAll(async () => {
    await testbed.module.close();
  });

  it('opens one simulation per user and agent with its setup, and keeps it', async () => {
    const { workspaceId, input } = await seed();

    const first = await start(workspaceId, input);
    const again = await start(workspaceId, input);

    expect(first).toEqual({
      conversation: expect.objectContaining({
        state: ConversationState.AgentActive,
        channelKind: ChannelKind.Simulated,
        language: TEST_END_USER_LANGUAGE,
        versionId: null,
      }),
      messages: [],
    });
    expect(again.conversation.id).toBe(first.conversation.id);
  });

  it('closes the open simulation and opens a fresh one when the setup changes', async () => {
    const { workspaceId, agentId, input } = await seed();
    const published = await seedPublishedVersion(testbed.module, workspaceId, agentId);
    const versionId = testbed.ids.toPublic(IdPrefix.AgentVersion, published);
    const first = await start(workspaceId, input);

    const second = await start(workspaceId, { ...input, versionId });

    const firstId = testbed.ids.fromPublic(IdPrefix.Conversation, first.conversation.id);
    const closed = await testbed.tenants.run(workspaceId, () =>
      testbed.conversations.findById(workspaceId, firstId),
    );
    expect(closed?.state).toBe(ConversationState.Closed);
    expect(second.conversation.versionId).toBe(versionId);
  });

  it('refuses an unpublished version, an agent of another workspace and an operator', async () => {
    const { workspaceId, input, draftId: draft } = await seed();
    const other = await seed();
    const draftId = testbed.ids.toPublic(IdPrefix.AgentVersion, draft);

    await expect(start(workspaceId, { ...input, versionId: draftId })).rejects.toMatchObject({
      reason: ErrorReason.AgentVersionNotFound,
    });
    await expect(start(workspaceId, other.input)).rejects.toMatchObject({
      reason: ErrorReason.AgentNotFound,
    });
    await expect(start(workspaceId, input, WorkspaceRole.Operator)).rejects.toBeInstanceOf(
      PermissionDeniedError,
    );
  });

  it('refuses a deleted agent, also with one of its published versions pinned', async () => {
    const { workspaceId, agentId, input } = await seed();
    const published = await seedPublishedVersion(testbed.module, workspaceId, agentId);
    const versionId = testbed.ids.toPublic(IdPrefix.AgentVersion, published);
    await deleteAgent(testbed.module, workspaceId, agentId);

    await expect(start(workspaceId, input)).rejects.toMatchObject({
      reason: ErrorReason.AgentNotFound,
    });
    await expect(start(workspaceId, { ...input, versionId })).rejects.toMatchObject({
      reason: ErrorReason.AgentNotFound,
    });
  });
});
