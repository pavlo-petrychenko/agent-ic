import { IdPrefix, WorkspaceRole } from '@agent-ic/contracts';
import { ChannelKind } from '@/modules/conversations/constants/conversation.constants';
import { StartSimulationUseCase } from '@/modules/conversations/use-cases/start-simulation.use-case';
import { workspaceCtx } from '@test/support/fixtures/workspace.fixture';
import { seedAgentWithDraft } from '@test/support/helpers/agents-testing.helpers';
import type { ConversationsTestbed } from '@test/support/typedefs/conversations-testing.typedefs';
import type { StartedSimulation } from '@test/support/typedefs/simulator-testing.typedefs';

export const startTestSimulation = async (
  testbed: ConversationsTestbed,
  versionOf: (agentId: string, workspaceId: string) => Promise<string | null> = () =>
    Promise.resolve(null),
): Promise<StartedSimulation> => {
  const workspaceId = testbed.ids.generate();
  const { agentId, draftId } = await seedAgentWithDraft(testbed.module, workspaceId);
  const ctx = workspaceCtx(testbed.ids.generate(), workspaceId, WorkspaceRole.Builder);
  const versionId = await versionOf(agentId, workspaceId);
  const publicAgentId = testbed.ids.toPublic(IdPrefix.Agent, agentId);
  const simulation = await testbed.module.get(StartSimulationUseCase).execute(ctx, {
    agentId: publicAgentId,
    versionId: versionId === null ? null : testbed.ids.toPublic(IdPrefix.AgentVersion, versionId),
    channelKind: ChannelKind.Simulated,
    language: null,
  });
  return { workspaceId, agentId, draftId, versionId, publicAgentId, ctx, simulation };
};
