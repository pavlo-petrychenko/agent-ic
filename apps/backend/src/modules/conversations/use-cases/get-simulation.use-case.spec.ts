import { WorkspaceRole } from '@agent-ic/contracts';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { GetSimulationUseCase } from '@/modules/conversations/use-cases/get-simulation.use-case';
import { PermissionDeniedError } from '@/platform/context/errors/permission-denied.error';
import { workspaceCtx } from '@test/support/fixtures/workspace.fixture';
import { createConversationsTestbed } from '@test/support/helpers/conversations-testing.helpers';
import { startTestSimulation } from '@test/support/helpers/simulator-testing.helpers';
import type { ConversationsTestbed } from '@test/support/typedefs/conversations-testing.typedefs';

describe('GetSimulationUseCase', () => {
  let testbed: ConversationsTestbed;

  beforeAll(async () => {
    testbed = await createConversationsTestbed();
  });

  afterAll(async () => {
    await testbed.module.close();
  });

  it("returns the caller's open simulation, and nothing to anyone else", async () => {
    const { ctx, workspaceId, publicAgentId, simulation } = await startTestSimulation(testbed);
    const stranger = workspaceCtx(testbed.ids.generate(), workspaceId, WorkspaceRole.Builder);
    const get = (asCtx = ctx) =>
      testbed.module.get(GetSimulationUseCase).execute(asCtx, { agentId: publicAgentId });

    expect(await get()).toEqual(simulation);
    expect(await get(stranger)).toBeNull();
    expect(await get({ ...ctx, workspaceId: testbed.ids.generate() })).toBeNull();
    await expect(get({ ...ctx, workspaceRole: WorkspaceRole.Operator })).rejects.toBeInstanceOf(
      PermissionDeniedError,
    );
  });
});
