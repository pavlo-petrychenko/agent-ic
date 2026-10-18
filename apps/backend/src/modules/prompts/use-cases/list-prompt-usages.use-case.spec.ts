import { IdPrefix, WorkspaceRole } from '@agent-ic/contracts';
import { PromptVersionKind } from '@agent-ic/flow';
import type { TestingModule } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AgentVersionKind } from '@/modules/agents';
import { PromptUsageVersionKind } from '@/modules/prompts/constants/prompt-usage.constants';
import { PromptNotFoundError } from '@/modules/prompts/errors/prompt-not-found.error';
import { ListPromptUsagesUseCase } from '@/modules/prompts/use-cases/list-prompt-usages.use-case';
import { PermissionDeniedError } from '@/platform/context/errors/permission-denied.error';
import { IdService } from '@/platform/ids/services/id.service';
import { TEST_AGENT_NAME } from '@test/support/constants/agents-testing.constants';
import { TEST_PROMPT_TEXT } from '@test/support/constants/prompts-testing.constants';
import {
  SECOND_STEP_ID,
  SECOND_STEP_KEY,
  TEST_STEP_NODE_ID,
  TEST_STEP_NODE_KEY,
} from '@test/support/constants/runs-testing.constants';
import { emptyFlow } from '@test/support/fixtures/agents.fixture';
import {
  agentWithLibraryPrompt,
  libraryPromptFlow,
} from '@test/support/fixtures/prompt-flow.fixture';
import {
  makeVersionLive,
  publicAgentId,
  seedAgentVersion,
  seedAgentWithDraft,
  seedPublishedVersion,
} from '@test/support/helpers/agents-testing.helpers';
import {
  createPromptsTestingModule,
  promptsCtx,
  publicPromptId,
  seedPrompt,
  seedPromptFolder,
  seedPromptVersion,
} from '@test/support/helpers/prompts-testing.helpers';

const SECOND_NUMBER = 2;
const OLDER_NUMBER = 1;
const LIVE_NUMBER = 2;
const STEP_LABEL = 'Receptionist';

describe('ListPromptUsagesUseCase', () => {
  let testingModule: TestingModule;
  let listPromptUsages: ListPromptUsagesUseCase;
  let ids: IdService;

  beforeAll(async () => {
    testingModule = await createPromptsTestingModule();
    listPromptUsages = testingModule.get(ListPromptUsagesUseCase);
    ids = testingModule.get(IdService);
  });

  afterAll(async () => {
    await testingModule.close();
  });

  const seedPromptWithVersions = async (workspaceId: string): Promise<string> => {
    const suffix = ids.generate();
    const folderId = await seedPromptFolder(testingModule, workspaceId, {
      name: `Folder ${suffix}`,
    });
    const promptId = await seedPrompt(testingModule, workspaceId, folderId, {
      name: `Prompt ${suffix}`,
    });
    await seedPromptVersion(testingModule, workspaceId, promptId, { text: TEST_PROMPT_TEXT });
    await seedPromptVersion(testingModule, workspaceId, promptId, { number: SECOND_NUMBER });
    return publicPromptId(testingModule, promptId);
  };

  const publicVersionId = (versionId: string): string =>
    ids.toPublic(IdPrefix.AgentVersion, versionId);

  it('lists the live and the draft version that use the prompt', async () => {
    const workspaceId = ids.generate();
    const promptRef = await seedPromptWithVersions(workspaceId);
    const { agentId, draftId } = await seedAgentWithDraft(
      testingModule,
      workspaceId,
      libraryPromptFlow([
        agentWithLibraryPrompt(
          TEST_STEP_NODE_ID,
          TEST_STEP_NODE_KEY,
          promptRef,
          { kind: PromptVersionKind.Pinned, number: SECOND_NUMBER },
          STEP_LABEL,
        ),
      ]),
    );
    const liveId = await seedPublishedVersion(testingModule, workspaceId, agentId, {
      number: LIVE_NUMBER,
      flow: libraryPromptFlow([agentWithLibraryPrompt(SECOND_STEP_ID, SECOND_STEP_KEY, promptRef)]),
    });
    await makeVersionLive(testingModule, workspaceId, agentId, liveId);

    const usages = await listPromptUsages.execute(promptsCtx(testingModule, workspaceId), {
      id: promptRef,
    });

    expect(usages).toEqual([
      {
        agentId: publicAgentId(testingModule, agentId),
        agentName: TEST_AGENT_NAME,
        versionId: publicVersionId(liveId),
        versionKind: PromptUsageVersionKind.Live,
        versionNumber: LIVE_NUMBER,
        nodeId: SECOND_STEP_ID,
        nodeKey: SECOND_STEP_KEY,
        nodeLabel: SECOND_STEP_KEY,
        pin: { kind: PromptVersionKind.Latest },
      },
      {
        agentId: publicAgentId(testingModule, agentId),
        agentName: TEST_AGENT_NAME,
        versionId: publicVersionId(draftId),
        versionKind: PromptUsageVersionKind.Draft,
        versionNumber: null,
        nodeId: TEST_STEP_NODE_ID,
        nodeKey: TEST_STEP_NODE_KEY,
        nodeLabel: STEP_LABEL,
        pin: { kind: PromptVersionKind.Pinned, number: SECOND_NUMBER },
      },
    ]);
  });

  it('leaves out snapshots, older published versions, other prompts and other workspaces', async () => {
    const workspaceId = ids.generate();
    const promptRef = await seedPromptWithVersions(workspaceId);
    const otherPromptRef = await seedPromptWithVersions(workspaceId);
    const flow = libraryPromptFlow([
      agentWithLibraryPrompt(TEST_STEP_NODE_ID, TEST_STEP_NODE_KEY, promptRef),
    ]);
    const { agentId } = await seedAgentWithDraft(testingModule, workspaceId, flow);
    await seedPublishedVersion(testingModule, workspaceId, agentId, { number: OLDER_NUMBER, flow });
    const liveId = await seedPublishedVersion(testingModule, workspaceId, agentId, {
      number: LIVE_NUMBER,
      flow,
    });
    await makeVersionLive(testingModule, workspaceId, agentId, liveId);
    await seedAgentVersion(testingModule, workspaceId, agentId, {
      kind: AgentVersionKind.Snapshot,
      flow,
    });
    await seedAgentWithDraft(testingModule, ids.generate(), flow);
    await seedAgentWithDraft(testingModule, workspaceId, emptyFlow());

    const usages = await listPromptUsages.execute(promptsCtx(testingModule, workspaceId), {
      id: promptRef,
    });
    const otherUsages = await listPromptUsages.execute(promptsCtx(testingModule, workspaceId), {
      id: otherPromptRef,
    });

    expect(usages.map((usage) => [usage.versionKind, usage.versionNumber])).toEqual([
      [PromptUsageVersionKind.Live, LIVE_NUMBER],
      [PromptUsageVersionKind.Draft, null],
    ]);
    expect(otherUsages).toEqual([]);
  });

  it('falls back to the node key when the step has no label', async () => {
    const workspaceId = ids.generate();
    const promptRef = await seedPromptWithVersions(workspaceId);
    await seedAgentWithDraft(
      testingModule,
      workspaceId,
      libraryPromptFlow([
        agentWithLibraryPrompt(
          TEST_STEP_NODE_ID,
          TEST_STEP_NODE_KEY,
          promptRef,
          { kind: PromptVersionKind.Latest },
          '',
        ),
      ]),
    );

    const usages = await listPromptUsages.execute(promptsCtx(testingModule, workspaceId), {
      id: promptRef,
    });

    expect(usages[0]?.nodeLabel).toBe(TEST_STEP_NODE_KEY);
  });

  it('refuses an unknown prompt', async () => {
    const workspaceId = ids.generate();

    const attempt = listPromptUsages.execute(promptsCtx(testingModule, workspaceId), {
      id: publicPromptId(testingModule, ids.generate()),
    });

    await expect(attempt).rejects.toBeInstanceOf(PromptNotFoundError);
  });

  it('refuses an operator', async () => {
    const workspaceId = ids.generate();
    const promptRef = await seedPromptWithVersions(workspaceId);

    const attempt = listPromptUsages.execute(
      promptsCtx(testingModule, workspaceId, WorkspaceRole.Operator),
      { id: promptRef },
    );

    await expect(attempt).rejects.toBeInstanceOf(PermissionDeniedError);
  });
});
