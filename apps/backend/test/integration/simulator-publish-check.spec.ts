import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AgentRuntimeReader } from '@/modules/agents';
import {
  DRAFT_INITIAL_REVISION,
  SimulatorCheckStatus,
} from '@/modules/agents/constants/agent.constants';
import { AgentVersionsRepository } from '@/modules/agents/repositories/agent-versions.repository';
import { PreviewAgentPublishUseCase } from '@/modules/agents/use-cases/preview-agent-publish.use-case';
import { ConversationMode } from '@/modules/conversations';
import { RunStatus } from '@/modules/runs/constants/run.constants';
import { TestRedisPrefix } from '@test/support/constants/test-infrastructure.constants';
import { triggerFlow } from '@test/support/fixtures/agents.fixture';
import { newRun } from '@test/support/fixtures/runs.fixture';
import {
  agentsCtx,
  publicAgentId,
  seedAgentWithDraft,
} from '@test/support/helpers/agents-testing.helpers';
import { createRunsTestbed } from '@test/support/helpers/runs-testing.helpers';
import type { RunExecutionTestbed } from '@test/support/typedefs/runs-testing.typedefs';

describe('the publish check after a simulator test', () => {
  let testbed: RunExecutionTestbed;

  beforeAll(async () => {
    testbed = await createRunsTestbed(TestRedisPrefix.SimulatorTests);
  });

  afterAll(async () => {
    await testbed.module.close();
  });

  it('marks the draft tested after a finished simulation run, until the draft changes', async () => {
    const workspaceId = testbed.ids.generate();
    const { agentId, draftId } = await seedAgentWithDraft(testbed.module, workspaceId);
    const ctx = agentsCtx(testbed.module, workspaceId);
    const preview = async () =>
      (
        await testbed.module
          .get(PreviewAgentPublishUseCase)
          .execute(ctx, { agentId: publicAgentId(testbed.module, agentId) })
      ).simulator;
    const finishedAt = testbed.clock.now();

    const untested = await preview();
    await testbed.tenants.run(workspaceId, async () => {
      const snapshot = await testbed.module
        .get(AgentRuntimeReader)
        .snapshotDraft(workspaceId, agentId);
      const run = {
        ...newRun(testbed, workspaceId),
        mode: ConversationMode.Simulation,
        agentId,
        versionId: snapshot.id,
      };
      await testbed.runs.insert(run);
      await testbed.runs.finish(workspaceId, run.id, {
        status: RunStatus.Succeeded,
        error: null,
        finishedAt,
      });
    });
    const tested = await preview();
    await testbed.tenants.run(workspaceId, () =>
      testbed.module
        .get(AgentVersionsRepository)
        .updateDraft(
          workspaceId,
          draftId,
          DRAFT_INITIAL_REVISION,
          { flow: triggerFlow(), note: null, authorId: testbed.ids.generate() },
          finishedAt,
        ),
    );
    const changed = await preview();

    expect(untested).toEqual({ status: SimulatorCheckStatus.NotTested, testedAt: null });
    expect(tested).toEqual({ status: SimulatorCheckStatus.Tested, testedAt: finishedAt });
    expect(changed).toEqual(untested);
  });
});
