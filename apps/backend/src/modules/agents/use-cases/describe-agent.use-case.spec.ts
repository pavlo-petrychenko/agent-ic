import { AGENT_DESCRIPTION_MAX_LENGTH, ErrorReason, WorkspaceRole } from '@agent-ic/contracts';
import type { TestingModule } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AgentField } from '@/modules/agents/constants/agent-input.constants';
import { AgentNotFoundError } from '@/modules/agents/errors/agent-not-found.error';
import { InvalidAgentInputError } from '@/modules/agents/errors/invalid-agent-input.error';
import { DescribeAgentUseCase } from '@/modules/agents/use-cases/describe-agent.use-case';
import { PermissionDeniedError } from '@/platform/context/errors/permission-denied.error';
import { IdService } from '@/platform/ids/services/id.service';
import { TEST_AGENT_DESCRIPTION } from '@test/support/constants/agents-testing.constants';
import {
  agentsCtx,
  createAgentsTestingModule,
  publicAgentId,
  readAgent,
  seedAgentWithDraft,
} from '@test/support/helpers/agents-testing.helpers';

const BLANK_DESCRIPTION = '   ';

describe('DescribeAgentUseCase', () => {
  let testingModule: TestingModule;
  let describeAgent: DescribeAgentUseCase;
  let ids: IdService;

  beforeAll(async () => {
    testingModule = await createAgentsTestingModule();
    describeAgent = testingModule.get(DescribeAgentUseCase);
    ids = testingModule.get(IdService);
  });

  afterAll(async () => {
    await testingModule.close();
  });

  it('stores a trimmed description and clears it with blank text', async () => {
    const workspaceId = ids.generate();
    const { agentId } = await seedAgentWithDraft(testingModule, workspaceId);
    const id = publicAgentId(testingModule, agentId);
    const ctx = agentsCtx(testingModule, workspaceId, WorkspaceRole.Builder);

    const described = await describeAgent.execute(ctx, {
      id,
      description: ` ${TEST_AGENT_DESCRIPTION} `,
    });
    const stored = await readAgent(testingModule, workspaceId, agentId);
    const cleared = await describeAgent.execute(ctx, { id, description: BLANK_DESCRIPTION });

    expect(described.description).toBe(TEST_AGENT_DESCRIPTION);
    expect(stored?.description).toBe(TEST_AGENT_DESCRIPTION);
    expect(cleared.description).toBeNull();
  });

  it('refuses a description over the limit', async () => {
    const workspaceId = ids.generate();
    const { agentId } = await seedAgentWithDraft(testingModule, workspaceId);

    const attempt = describeAgent.execute(agentsCtx(testingModule, workspaceId), {
      id: publicAgentId(testingModule, agentId),
      description: 'a'.repeat(AGENT_DESCRIPTION_MAX_LENGTH + 1),
    });

    await expect(attempt).rejects.toBeInstanceOf(InvalidAgentInputError);
    await expect(attempt).rejects.toMatchObject({
      fields: [{ path: AgentField.Description, reason: ErrorReason.InvalidAgentDescription }],
    });
  });

  it('does not find an agent of another workspace', async () => {
    const { agentId } = await seedAgentWithDraft(testingModule, ids.generate());

    const attempt = describeAgent.execute(agentsCtx(testingModule, ids.generate()), {
      id: publicAgentId(testingModule, agentId),
      description: TEST_AGENT_DESCRIPTION,
    });

    await expect(attempt).rejects.toBeInstanceOf(AgentNotFoundError);
  });

  it('refuses an operator', async () => {
    const workspaceId = ids.generate();
    const { agentId } = await seedAgentWithDraft(testingModule, workspaceId);

    const attempt = describeAgent.execute(
      agentsCtx(testingModule, workspaceId, WorkspaceRole.Operator),
      { id: publicAgentId(testingModule, agentId), description: TEST_AGENT_DESCRIPTION },
    );

    await expect(attempt).rejects.toBeInstanceOf(PermissionDeniedError);
  });
});
