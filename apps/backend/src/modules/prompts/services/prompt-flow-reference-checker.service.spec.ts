import { IdPrefix } from '@agent-ic/contracts';
import {
  FlowIssueCode,
  FlowIssueSeverity,
  PromptSourceKind,
  PromptVersionKind,
} from '@agent-ic/flow';
import type {
  FlowDocument,
  FlowIssue,
  FlowIssueParams,
  PromptPin,
  PromptSource,
} from '@agent-ic/flow';
import type { TestingModule } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { FIRST_PROMPT_VERSION_NUMBER } from '@/modules/prompts/constants/prompt.constants';
import { PromptVersionsRepository } from '@/modules/prompts/repositories/prompt-versions.repository';
import { PromptsRepository } from '@/modules/prompts/repositories/prompts.repository';
import { PromptFlowReferenceChecker } from '@/modules/prompts/services/prompt-flow-reference-checker.service';
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
const THIRD_STEP_NODE_ID = 'n_third';
const UNKNOWN_REF = 'not-a-prompt';

const library = (
  promptRef: string,
  pin: PromptPin,
  bindings: PromptSource['bindings'] = {},
): PromptSource => ({
  kind: PromptSourceKind.Library,
  promptRef,
  pin,
  bindings,
});

const pinned = (number: number): PromptPin => ({ kind: PromptVersionKind.Pinned, number });
const latest: PromptPin = { kind: PromptVersionKind.Latest };

const flowWith = (nodes: readonly { id: string; prompt: PromptSource | null }[]): FlowDocument =>
  stepFlow(
    nodes.map(({ id, prompt }) => agentNode(id, id, { prompt })),
    nodes.map(({ id }) => flowEdge(TEST_NODE_ID, id)),
  );

const promptIssue = (
  code: FlowIssueCode,
  nodeId: string,
  params: FlowIssueParams = {},
  path: readonly string[] = ['prompt'],
): FlowIssue => ({
  code,
  severity: FlowIssueSeverity.Error,
  nodeId,
  edgeId: null,
  path,
  params,
});

const bindingIssue = (
  code: FlowIssueCode,
  nodeId: string,
  variable: string,
  params: FlowIssueParams = { variable },
): FlowIssue => promptIssue(code, nodeId, params, ['prompt', 'bindings', variable]);

describe('PromptFlowReferenceChecker', () => {
  let testingModule: TestingModule;
  let checker: PromptFlowReferenceChecker;
  let prompts: PromptsRepository;
  let versions: PromptVersionsRepository;
  let tenants: TenantTransactionService;
  let ids: IdService;

  beforeAll(async () => {
    testingModule = await createPromptsTestingModule();
    checker = testingModule.get(PromptFlowReferenceChecker);
    prompts = testingModule.get(PromptsRepository);
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

  const check = (workspaceId: string, flow: FlowDocument): Promise<readonly FlowIssue[]> =>
    tenants.run(workspaceId, () => checker.check(workspaceId, flow));

  it('reports nothing for a pinned version and a latest prompt that exist', async () => {
    const workspaceId = ids.generate();
    const promptRef = await seedPromptWithVersions(workspaceId, [
      TEST_PROMPT_TEXT,
      TEST_PROMPT_LATER_TEXT,
    ]);

    const issues = await check(
      workspaceId,
      flowWith([
        { id: STEP_NODE_ID, prompt: library(promptRef, pinned(SECOND_NUMBER)) },
        { id: OTHER_STEP_NODE_ID, prompt: library(promptRef, latest) },
      ]),
    );

    expect(issues).toEqual([]);
  });

  it('reports a declared prompt variable without a binding', async () => {
    const workspaceId = ids.generate();
    const promptRef = await seedPromptWithVersions(workspaceId, ['Hi {{customer_name}}.']);

    const issues = await check(
      workspaceId,
      flowWith([{ id: STEP_NODE_ID, prompt: library(promptRef, latest) }]),
    );

    expect(issues).toEqual([
      bindingIssue(FlowIssueCode.PromptVariableUnmapped, STEP_NODE_ID, 'customer_name'),
    ]);
  });

  it('accepts a binding to a visible step variable', async () => {
    const workspaceId = ids.generate();
    const promptRef = await seedPromptWithVersions(workspaceId, ['Hi {{customer_name}}.']);

    const issues = await check(
      workspaceId,
      flowWith([
        { id: STEP_NODE_ID, prompt: library(promptRef, latest, { customer_name: 'user.name' }) },
      ]),
    );

    expect(issues).toEqual([]);
  });

  it('reports a binding target that the step cannot see', async () => {
    const workspaceId = ids.generate();
    const promptRef = await seedPromptWithVersions(workspaceId, ['Hi {{customer_name}}.']);

    const issues = await check(
      workspaceId,
      flowWith([
        {
          id: STEP_NODE_ID,
          prompt: library(promptRef, latest, { customer_name: 'missing.value' }),
        },
      ]),
    );

    expect(issues).toEqual([
      bindingIssue(FlowIssueCode.UnknownVariable, STEP_NODE_ID, 'customer_name', {
        variable: 'missing.value',
        promptVariable: 'customer_name',
      }),
    ]);
  });

  it('reports a missing version for a pinned number that never existed', async () => {
    const workspaceId = ids.generate();
    const promptRef = await seedPromptWithVersions(workspaceId, [TEST_PROMPT_TEXT]);

    const issues = await check(
      workspaceId,
      flowWith([{ id: STEP_NODE_ID, prompt: library(promptRef, pinned(MISSING_NUMBER)) }]),
    );

    expect(issues).toEqual([
      promptIssue(FlowIssueCode.MissingPromptVersion, STEP_NODE_ID, { number: MISSING_NUMBER }),
    ]);
  });

  it('reports a missing prompt for an unknown ref, a malformed ref and a prompt without versions', async () => {
    const workspaceId = ids.generate();
    const nonexistentRef = ids.toPublic(IdPrefix.Prompt, ids.generate());
    const emptyRef = await seedPromptWithVersions(workspaceId, []);

    const issues = await check(
      workspaceId,
      flowWith([
        { id: STEP_NODE_ID, prompt: library(nonexistentRef, latest) },
        { id: OTHER_STEP_NODE_ID, prompt: library(UNKNOWN_REF, latest) },
        { id: THIRD_STEP_NODE_ID, prompt: library(emptyRef, latest) },
      ]),
    );

    expect(issues).toEqual([
      promptIssue(FlowIssueCode.MissingPrompt, STEP_NODE_ID),
      promptIssue(FlowIssueCode.MissingPrompt, OTHER_STEP_NODE_ID),
      promptIssue(FlowIssueCode.MissingPrompt, THIRD_STEP_NODE_ID),
    ]);
  });

  it('reports a deleted prompt and a prompt of another workspace as missing', async () => {
    const workspaceId = ids.generate();
    const otherWorkspaceId = ids.generate();
    const deletedFolderId = await seedPromptFolder(testingModule, workspaceId);
    const deletedPromptId = await seedPrompt(testingModule, workspaceId, deletedFolderId);
    await seedPromptVersion(testingModule, workspaceId, deletedPromptId);
    await tenants.run(workspaceId, async () => {
      await versions.softDeleteByPrompt(workspaceId, deletedPromptId, PROMPTS_TEST_LATER);
      await prompts.softDelete(workspaceId, deletedPromptId, PROMPTS_TEST_LATER);
    });
    const deletedRef = publicPromptId(testingModule, deletedPromptId);
    const foreignRef = await seedPromptWithVersions(otherWorkspaceId, [TEST_PROMPT_TEXT]);

    const issues = await check(
      workspaceId,
      flowWith([
        { id: STEP_NODE_ID, prompt: library(deletedRef, latest) },
        { id: OTHER_STEP_NODE_ID, prompt: library(foreignRef, latest) },
      ]),
    );

    expect(issues).toEqual([
      promptIssue(FlowIssueCode.MissingPrompt, STEP_NODE_ID),
      promptIssue(FlowIssueCode.MissingPrompt, OTHER_STEP_NODE_ID),
    ]);
  });

  it('ignores steps without a prompt', async () => {
    const workspaceId = ids.generate();

    const issues = await check(
      workspaceId,
      flowWith([
        { id: STEP_NODE_ID, prompt: null },
        { id: OTHER_STEP_NODE_ID, prompt: null },
      ]),
    );

    expect(issues).toEqual([]);
  });
});
