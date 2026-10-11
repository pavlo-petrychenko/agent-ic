import { IdPrefix, WorkspaceRole } from '@agent-ic/contracts';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AgentVersionKind } from '@/modules/agents';
import { MessageAuthor } from '@/modules/conversations/constants/message.constants';
import { ConversationClosedError } from '@/modules/conversations/errors/conversation-closed.error';
import { ConversationNotFoundError } from '@/modules/conversations/errors/conversation-not-found.error';
import { RestartSimulationUseCase } from '@/modules/conversations/use-cases/restart-simulation.use-case';
import { SendSimulatorMessageUseCase } from '@/modules/conversations/use-cases/send-simulator-message.use-case';
import { PermissionDeniedError } from '@/platform/context/errors/permission-denied.error';
import { TEST_MESSAGE_TEXT } from '@test/support/constants/conversations-testing.constants';
import { workspaceCtx } from '@test/support/fixtures/workspace.fixture';
import { readVersions, seedPublishedVersion } from '@test/support/helpers/agents-testing.helpers';
import {
  createConversationsTestbed,
  queuedEventsFor,
} from '@test/support/helpers/conversations-testing.helpers';
import { startTestSimulation } from '@test/support/helpers/simulator-testing.helpers';
import { runOnMessageReceived } from '@test/support/jobs/conversation-probe.job';
import type { ConversationsTestbed } from '@test/support/typedefs/conversations-testing.typedefs';
import type { StartedSimulation } from '@test/support/typedefs/simulator-testing.typedefs';

const byText = (left: string, right: string): number => left.localeCompare(right);

describe('SendSimulatorMessageUseCase', () => {
  let testbed: ConversationsTestbed;

  const send = ({ ctx, simulation }: StartedSimulation, asCtx = ctx) =>
    testbed.module
      .get(SendSimulatorMessageUseCase)
      .execute(asCtx, { conversationId: simulation.conversation.id, text: TEST_MESSAGE_TEXT });

  const pinnedVersions = async ({ simulation }: StartedSimulation) => {
    const conversationId = testbed.ids.fromPublic(
      IdPrefix.Conversation,
      simulation.conversation.id,
    );
    const events = await queuedEventsFor(testbed, runOnMessageReceived, conversationId);
    return events.map((event) => String(event['versionId'])).toSorted(byText);
  };

  beforeAll(async () => {
    testbed = await createConversationsTestbed();
  });

  afterAll(async () => {
    await testbed.module.close();
  });

  it('stores the message and pins each run to a new snapshot of the draft', async () => {
    const started = await startTestSimulation(testbed);

    const message = await send(started);
    await send(started);

    const versions = await readVersions(testbed.module, started.workspaceId, started.agentId);
    const snapshots = versions.filter((version) => version.kind === AgentVersionKind.Snapshot);
    expect(message).toMatchObject({ author: MessageAuthor.Customer, text: TEST_MESSAGE_TEXT });
    expect(await pinnedVersions(started)).toEqual(snapshots.map(({ id }) => id).toSorted(byText));
    expect(snapshots).toHaveLength(2);
  });

  it('pins each run to the published version the simulation was started with', async () => {
    const started = await startTestSimulation(testbed, (agentId, workspaceId) =>
      seedPublishedVersion(testbed.module, workspaceId, agentId),
    );

    await send(started);

    expect(await pinnedVersions(started)).toEqual([started.versionId]);
  });

  it("refuses a closed simulation, another user's or workspace's simulation and an operator", async () => {
    const started = await startTestSimulation(testbed);
    const stranger = workspaceCtx(
      testbed.ids.generate(),
      started.workspaceId,
      WorkspaceRole.Builder,
    );
    const operator = { ...started.ctx, workspaceRole: WorkspaceRole.Operator };

    await expect(send(started, stranger)).rejects.toBeInstanceOf(ConversationNotFoundError);
    await expect(
      send(started, { ...started.ctx, workspaceId: testbed.ids.generate() }),
    ).rejects.toBeInstanceOf(ConversationNotFoundError);
    await expect(send(started, operator)).rejects.toBeInstanceOf(PermissionDeniedError);
    await testbed.module
      .get(RestartSimulationUseCase)
      .execute(started.ctx, { agentId: started.publicAgentId });
    await expect(send(started)).rejects.toBeInstanceOf(ConversationClosedError);
  });
});
