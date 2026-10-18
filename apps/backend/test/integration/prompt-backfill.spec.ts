import { NodeType, PromptSourceKind, PromptVersionKind } from '@agent-ic/flow';
import type { FlowDocument, PromptSource } from '@agent-ic/flow';
import type { INestApplicationContext } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppModule } from '@/app/app.module';
import { BACKFILL_ROLE_SELECTION } from '@/app/constants/backfill.constants';
import { AgentVersionsRepository } from '@/modules/agents/repositories/agent-versions.repository';
import { AgentsRepository } from '@/modules/agents/repositories/agents.repository';
import { WorkspaceDirectoryRepository } from '@/modules/identity';
import { PromptBackfillService } from '@/modules/prompts';
import { PromptsRepository } from '@/modules/prompts/repositories/prompts.repository';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { IdService } from '@/platform/ids/services/id.service';
import { TracingService } from '@/platform/observability/services/tracing.service';
import { AGENTS_TEST_START, TEST_NODE_ID } from '@test/support/constants/agents-testing.constants';
import { TestRedisPrefix } from '@test/support/constants/test-infrastructure.constants';
import { newAgent, newVersion } from '@test/support/fixtures/agents.fixture';
import { createIntegrationConfig } from '@test/support/fixtures/integration-env.fixture';
import { agentNode, flowEdge, stepFlow } from '@test/support/fixtures/runs.fixture';

const STEP_NODE_ID = 'n_answer';
const STEP_NODE_LABEL = 'Answer';
const STEP_PROMPT_TEXT = 'Answer the customer briefly.';

const stepPrompt = (flow: FlowDocument | undefined): PromptSource | null => {
  const node = flow?.nodes.find((candidate) => candidate.id === STEP_NODE_ID);
  return node !== undefined && (node.type === NodeType.Agent || node.type === NodeType.Completion)
    ? node.config.prompt
    : null;
};

describe('backfillInlinePrompts', () => {
  let app: INestApplicationContext;

  beforeAll(async () => {
    const config = createIntegrationConfig(BACKFILL_ROLE_SELECTION, TestRedisPrefix.Backfill);
    app = await NestFactory.createApplicationContext(
      AppModule.forRole(config, new TracingService(config.telemetry)),
      { logger: false },
    );
  });

  afterAll(async () => {
    await app.close();
  });

  it('boots with the workspace directory and the backfill service', async () => {
    const directory = app.get(WorkspaceDirectoryRepository);

    expect(app.get(PromptBackfillService)).toBeDefined();
    expect(Array.isArray(await directory.listIds())).toBe(true);
  });

  it('rewrites a prompt written in a step through the booted application', async () => {
    const workspaceId = app.get(IdService).generate();
    const agentId = app.get(IdService).generate();
    const draftId = app.get(IdService).generate();
    const flow = stepFlow(
      [
        {
          ...agentNode(STEP_NODE_ID, 'answer', {
            prompt: { kind: PromptSourceKind.Inline, text: STEP_PROMPT_TEXT },
          }),
          label: STEP_NODE_LABEL,
        },
      ],
      [flowEdge(TEST_NODE_ID, STEP_NODE_ID)],
    );
    await app.get(TenantTransactionService).run(workspaceId, async () => {
      await app.get(AgentsRepository).insert(newAgent(agentId, workspaceId));
      await app
        .get(AgentVersionsRepository)
        .insert(newVersion(draftId, workspaceId, agentId, { flow }));
      await app
        .get(AgentsRepository)
        .setDraftVersion(workspaceId, agentId, draftId, AGENTS_TEST_START);
    });

    const counts = await app.get(PromptBackfillService).backfillWorkspace(workspaceId);

    expect(counts).toEqual({ versions: 1, prompts: 1 });
    const { version, prompts } = await app
      .get(TenantTransactionService)
      .run(workspaceId, async () => ({
        version: await app.get(AgentVersionsRepository).findById(workspaceId, draftId),
        prompts: await app.get(PromptsRepository).list(workspaceId),
      }));
    expect(stepPrompt(version?.flow)).toMatchObject({
      kind: PromptSourceKind.Library,
      pin: { kind: PromptVersionKind.Latest },
    });
    expect(prompts.map((prompt) => prompt.name)).toEqual(['Support agent · Answer']);
  });
});
