import { IdPrefix, WorkspaceRole } from '@agent-ic/contracts';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AgentRuntimeReader, AgentVersionKind } from '@/modules/agents';
import { RunStatus } from '@/modules/runs/constants/run.constants';
import { GetLastSimulationRunUseCase } from '@/modules/runs/use-cases/get-last-simulation-run.use-case';
import { PermissionDeniedError } from '@/platform/context/errors/permission-denied.error';
import { MESSAGE_SPACING_MS } from '@test/support/constants/conversations-testing.constants';
import { TestRedisPrefix } from '@test/support/constants/test-infrastructure.constants';
import { workspaceCtx } from '@test/support/fixtures/workspace.fixture';
import { seedPublishedVersion } from '@test/support/helpers/agents-testing.helpers';
import { createRunsTestbed, seedSimulationRun } from '@test/support/helpers/runs-testing.helpers';
import type { RunExecutionTestbed } from '@test/support/typedefs/runs-testing.typedefs';

const DRAFT_REVISION = 4;

describe('GetLastSimulationRunUseCase', () => {
  let testbed: RunExecutionTestbed;

  const lastRun = (workspaceId: string, agentId: string, role = WorkspaceRole.Builder) =>
    testbed.module
      .get(GetLastSimulationRunUseCase)
      .execute(workspaceCtx(testbed.ids.generate(), workspaceId, role), {
        agentId: testbed.ids.toPublic(IdPrefix.Agent, agentId),
      });

  beforeAll(async () => {
    testbed = await createRunsTestbed(TestRedisPrefix.LastSimulationRun);
  });

  afterAll(async () => {
    await testbed.module.close();
  });

  it('summarises the latest simulation run with the draft revision it tested', async () => {
    const { run } = await seedSimulationRun(testbed);
    const { workspaceId, agentId } = run;
    const published = await lastRun(workspaceId, agentId);
    testbed.clock.advanceBy(MESSAGE_SPACING_MS);
    const now = testbed.clock.now();
    const draft = { kind: AgentVersionKind.Draft, number: null, revision: DRAFT_REVISION };
    await seedPublishedVersion(testbed.module, workspaceId, agentId, draft);
    const later = await testbed.tenants.run(workspaceId, async () => {
      const snapshot = await testbed.module
        .get(AgentRuntimeReader)
        .snapshotDraft(workspaceId, agentId);
      const next = { ...run, id: testbed.ids.generate(), versionId: snapshot.id, createdAt: now };
      await testbed.runs.insert(next);
      return next;
    });

    const tested = await lastRun(workspaceId, agentId);

    expect(published).toMatchObject({ status: RunStatus.Queued, draftRevision: null });
    expect(tested).toEqual({
      id: testbed.ids.toPublic(IdPrefix.Run, later.id),
      status: RunStatus.Queued,
      finishedAt: null,
      draftRevision: DRAFT_REVISION,
    });
    expect(await lastRun(testbed.ids.generate(), agentId)).toBeNull();
    await expect(lastRun(workspaceId, agentId, WorkspaceRole.Operator)).rejects.toBeInstanceOf(
      PermissionDeniedError,
    );
  });
});
