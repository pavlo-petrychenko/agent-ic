import { PromptSourceKind, PromptVersionKind } from '@agent-ic/flow';
import type { FlowDocument, PromptPin, PromptSource } from '@agent-ic/flow';
import type { TestingModule } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { FIRST_PROMPT_VERSION_NUMBER } from '@/modules/prompts/constants/prompt.constants';
import { PromptVersionsRepository } from '@/modules/prompts/repositories/prompt-versions.repository';
import { PromptFlowReader } from '@/modules/prompts/services/prompt-flow-reader.service';
import type { ResolvedPrompts } from '@/modules/prompts/typedefs/resolved-prompt.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { IdService } from '@/platform/ids/services/id.service';
import { TEST_NODE_ID } from '@test/support/constants/agents-testing.constants';
import {
  PROMPTS_TEST_LATER,
  TEST_PROMPT_LATER_TEXT,
  TEST_PROMPT_TEXT,
} from '@test/support/constants/prompts-testing.constants';
import { agentNode, flowEdge, stepFlow } from '@test/support/fixtures/runs.fixture';
import {
  createPromptsTestingModule,
  publicPromptId,
  seedPrompt,
  seedPromptFolder,
  seedPromptVersion,
} from '@test/support/helpers/prompts-testing.helpers';

const SECOND_NUMBER = 2;
const MISSING_NUMBER = 5;
const STEP_NODE_ID = 'n_step';
const OTHER_STEP_NODE_ID = 'n_other';
const UNKNOWN_REF = 'not-a-prompt';

const library = (promptRef: string, pin: PromptPin): PromptSource => ({
  kind: PromptSourceKind.Library,
  promptRef,
  pin,
});

const pinned = (number: number): PromptPin => ({ kind: PromptVersionKind.Pinned, number });
const latest: PromptPin = { kind: PromptVersionKind.Latest };

const flowWith = (nodes: readonly { id: string; prompt: PromptSource | null }[]): FlowDocument =>
  stepFlow(
    nodes.map(({ id, prompt }) => agentNode(id, id, { prompt })),
    nodes.map(({ id }) => flowEdge(TEST_NODE_ID, id)),
  );

describe('PromptFlowReader', () => {
  let testingModule: TestingModule;
  let reader: PromptFlowReader;
  let versions: PromptVersionsRepository;
  let tenants: TenantTransactionService;
  let ids: IdService;

  beforeAll(async () => {
    testingModule = await createPromptsTestingModule();
    reader = testingModule.get(PromptFlowReader);
    versions = testingModule.get(PromptVersionsRepository);
    tenants = testingModule.get(TenantTransactionService);
    ids = testingModule.get(IdService);
  });

  afterAll(async () => {
    await testingModule.close();
  });

  const seedPromptWithVersions = async (
    workspaceId: string,
    texts: readonly string[],
  ): Promise<string> => {
    const suffix = ids.generate();
    const folderId = await seedPromptFolder(testingModule, workspaceId, {
      name: `Folder ${suffix}`,
    });
    const promptId = await seedPrompt(testingModule, workspaceId, folderId, {
      name: `Prompt ${suffix}`,
    });
    for (const [index, text] of texts.entries()) {
      await seedPromptVersion(testingModule, workspaceId, promptId, {
        number: FIRST_PROMPT_VERSION_NUMBER + index,
        text,
      });
    }
    return publicPromptId(testingModule, promptId);
  };

  const resolve = (workspaceId: string, flow: FlowDocument): Promise<ResolvedPrompts> =>
    tenants.run(workspaceId, () => reader.forFlow(workspaceId, flow));

  it('resolves the pinned version of a library prompt', async () => {
    const workspaceId = ids.generate();
    const promptRef = await seedPromptWithVersions(workspaceId, [
      TEST_PROMPT_TEXT,
      TEST_PROMPT_LATER_TEXT,
    ]);

    const resolved = await resolve(
      workspaceId,
      flowWith([{ id: STEP_NODE_ID, prompt: library(promptRef, pinned(SECOND_NUMBER)) }]),
    );

    expect(resolved.get(STEP_NODE_ID)).toEqual({
      promptRef,
      versionNumber: SECOND_NUMBER,
      text: TEST_PROMPT_LATER_TEXT,
    });
  });

  it('resolves the latest version at the time of the run', async () => {
    const workspaceId = ids.generate();
    const promptRef = await seedPromptWithVersions(workspaceId, [
      TEST_PROMPT_TEXT,
      TEST_PROMPT_LATER_TEXT,
    ]);

    const resolved = await resolve(
      workspaceId,
      flowWith([{ id: STEP_NODE_ID, prompt: library(promptRef, latest) }]),
    );

    expect(resolved.get(STEP_NODE_ID)).toEqual({
      promptRef,
      versionNumber: SECOND_NUMBER,
      text: TEST_PROMPT_LATER_TEXT,
    });
  });

  it('resolves the same prompt separately for every node and its own pin', async () => {
    const workspaceId = ids.generate();
    const promptRef = await seedPromptWithVersions(workspaceId, [
      TEST_PROMPT_TEXT,
      TEST_PROMPT_LATER_TEXT,
    ]);

    const resolved = await resolve(
      workspaceId,
      flowWith([
        { id: STEP_NODE_ID, prompt: library(promptRef, pinned(FIRST_PROMPT_VERSION_NUMBER)) },
        { id: OTHER_STEP_NODE_ID, prompt: library(promptRef, latest) },
      ]),
    );

    expect(resolved.get(STEP_NODE_ID)?.text).toBe(TEST_PROMPT_TEXT);
    expect(resolved.get(OTHER_STEP_NODE_ID)?.text).toBe(TEST_PROMPT_LATER_TEXT);
  });

  it('leaves a node unresolved for a missing version, an empty prompt and an unknown ref', async () => {
    const workspaceId = ids.generate();
    const promptRef = await seedPromptWithVersions(workspaceId, [TEST_PROMPT_TEXT]);
    const emptyRef = await seedPromptWithVersions(workspaceId, []);

    const resolved = await resolve(
      workspaceId,
      flowWith([
        { id: STEP_NODE_ID, prompt: library(promptRef, pinned(MISSING_NUMBER)) },
        { id: OTHER_STEP_NODE_ID, prompt: library(emptyRef, latest) },
        { id: 'n_unknown', prompt: library(UNKNOWN_REF, latest) },
        { id: 'n_missing', prompt: null },
      ]),
    );

    expect([...resolved.keys()]).toEqual([]);
  });

  it('never resolves a prompt of another workspace', async () => {
    const workspaceId = ids.generate();
    const otherWorkspaceId = ids.generate();
    const promptRef = await seedPromptWithVersions(otherWorkspaceId, [TEST_PROMPT_TEXT]);

    const resolved = await resolve(
      workspaceId,
      flowWith([{ id: STEP_NODE_ID, prompt: library(promptRef, latest) }]),
    );

    expect(resolved.get(STEP_NODE_ID)).toBeUndefined();
  });

  it('never resolves a deleted prompt', async () => {
    const workspaceId = ids.generate();
    const folderId = await seedPromptFolder(testingModule, workspaceId);
    const promptId = await seedPrompt(testingModule, workspaceId, folderId);
    await seedPromptVersion(testingModule, workspaceId, promptId, { text: TEST_PROMPT_TEXT });
    await tenants.run(workspaceId, () =>
      versions.softDeleteByPrompt(workspaceId, promptId, PROMPTS_TEST_LATER),
    );
    const promptRef = publicPromptId(testingModule, promptId);

    const resolved = await resolve(
      workspaceId,
      flowWith([{ id: STEP_NODE_ID, prompt: library(promptRef, latest) }]),
    );

    expect(resolved.get(STEP_NODE_ID)).toBeUndefined();
  });
});
