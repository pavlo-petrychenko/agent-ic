import { IdPrefix } from '@agent-ic/contracts';
import { NodeType, PromptSourceKind, PromptVersionKind } from '@agent-ic/flow';
import type { FlowDocument, PromptSource } from '@agent-ic/flow';
import type { TestingModule } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AgentVersionKind } from '@/modules/agents';
import {
  IMPORTED_PROMPTS_FOLDER_NAME,
  IMPORTED_PROMPT_NOTE,
} from '@/modules/prompts/constants/prompt-backfill.constants';
import { FIRST_PROMPT_VERSION_NUMBER } from '@/modules/prompts/constants/prompt.constants';
import { PromptFoldersRepository } from '@/modules/prompts/repositories/prompt-folders.repository';
import { PromptVersionsRepository } from '@/modules/prompts/repositories/prompt-versions.repository';
import { PromptsRepository } from '@/modules/prompts/repositories/prompts.repository';
import { PromptBackfillService } from '@/modules/prompts/services/prompt-backfill.service';
import type { Prompt } from '@/modules/prompts/typedefs/prompt.typedefs';
import { ClockService } from '@/platform/clock/services/clock.service';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { IdService } from '@/platform/ids/services/id.service';
import { TEST_NODE_ID } from '@test/support/constants/agents-testing.constants';
import { PROMPTS_TEST_START } from '@test/support/constants/prompts-testing.constants';
import { ManualClock } from '@test/support/fakes/manual-clock.fake';
import { agentNode, completionNode, flowEdge, stepFlow } from '@test/support/fixtures/runs.fixture';
import {
  readVersion,
  seedAgentVersion,
  seedAgentWithDraft,
  seedPublishedVersion,
} from '@test/support/helpers/agents-testing.helpers';
import { createPromptsTestingModule } from '@test/support/helpers/prompts-testing.helpers';

const AGENT_NODE_ID = 'n_answer';
const AGENT_NODE_LABEL = 'Answer';
const COMPLETION_NODE_ID = 'n_sort';
const COMPLETION_NODE_LABEL = 'Sort the message';
const LIBRARY_NODE_ID = 'n_summary';
const FIRST_NODE_ID = 'n_first';
const SECOND_NODE_ID = 'n_second';
const AGENT_PROMPT_TEXT = 'Answer the customer briefly.';
const COMPLETION_PROMPT_TEXT = 'Sort the message into a category.';
const EXISTING_PROMPT_REF = 'prm_existing';
const ANSWER_PROMPT_NAME = 'Support agent · Answer';
const SORT_PROMPT_NAME = 'Support agent · Sort the message';
const NUMBERED_ANSWER_PROMPT_NAME = `${ANSWER_PROMPT_NAME} 2`;
const DRAFT_REVISION_AFTER_BACKFILL = 1;
const NO_CHANGES = { versions: 0, prompts: 0 };
const THREE_VERSIONS = 3;
const TWO_PROMPTS = 2;

const inline = (text: string): PromptSource => ({ kind: PromptSourceKind.Inline, text });

const library = (promptRef: string): PromptSource => ({
  kind: PromptSourceKind.Library,
  promptRef,
  pin: { kind: PromptVersionKind.Latest },
});

const labelled = <TNode extends { label: string }>(node: TNode, label: string): TNode => ({
  ...node,
  label,
});

const flowWithInlineSteps = (): FlowDocument =>
  stepFlow(
    [
      labelled(
        agentNode(AGENT_NODE_ID, 'answer', { prompt: inline(AGENT_PROMPT_TEXT) }),
        AGENT_NODE_LABEL,
      ),
      labelled(
        completionNode(COMPLETION_NODE_ID, 'sort', { prompt: inline(COMPLETION_PROMPT_TEXT) }),
        COMPLETION_NODE_LABEL,
      ),
      agentNode(LIBRARY_NODE_ID, 'summary', { prompt: library(EXISTING_PROMPT_REF) }),
    ],
    [flowEdge(TEST_NODE_ID, AGENT_NODE_ID)],
  );

const nodePrompt = (document: FlowDocument | undefined, nodeId: string): PromptSource | null => {
  const node = document?.nodes.find((candidate) => candidate.id === nodeId);
  return node !== undefined && (node.type === NodeType.Agent || node.type === NodeType.Completion)
    ? node.config.prompt
    : null;
};

describe('PromptBackfillService', () => {
  let testingModule: TestingModule;
  let backfill: PromptBackfillService;
  let tenants: TenantTransactionService;
  let ids: IdService;
  let prompts: PromptsRepository;
  let promptVersions: PromptVersionsRepository;
  let folders: PromptFoldersRepository;

  beforeAll(async () => {
    testingModule = await createPromptsTestingModule([
      { token: ClockService, value: new ManualClock(PROMPTS_TEST_START) },
    ]);
    backfill = testingModule.get(PromptBackfillService);
    tenants = testingModule.get(TenantTransactionService);
    ids = testingModule.get(IdService);
    prompts = testingModule.get(PromptsRepository);
    promptVersions = testingModule.get(PromptVersionsRepository);
    folders = testingModule.get(PromptFoldersRepository);
  });

  afterAll(async () => {
    await testingModule.close();
  });

  const listPrompts = (workspaceId: string) =>
    tenants.run(workspaceId, () => prompts.list(workspaceId));

  const latestVersion = (workspaceId: string, promptId: string) =>
    tenants.run(workspaceId, () => promptVersions.findLatest(workspaceId, promptId));

  const importedFolder = (workspaceId: string) =>
    tenants.run(workspaceId, () => folders.findByName(workspaceId, IMPORTED_PROMPTS_FOLDER_NAME));

  const promptNamed = (created: readonly Prompt[], name: string): Prompt => {
    const prompt = created.find((candidate) => candidate.name === name);
    if (prompt === undefined) {
      throw new Error(`No prompt named ${name}`);
    }
    return prompt;
  };

  const refOf = (prompt: Prompt): string => ids.toPublic(IdPrefix.Prompt, prompt.id);

  it('rewrites the prompt written in a step into an imported library prompt', async () => {
    const workspaceId = ids.generate();
    const { draftId } = await seedAgentWithDraft(testingModule, workspaceId, flowWithInlineSteps());

    const counts = await backfill.backfillWorkspace(workspaceId);

    expect(counts).toEqual({ versions: 1, prompts: TWO_PROMPTS });
    const version = await readVersion(testingModule, workspaceId, draftId);
    const created = await listPrompts(workspaceId);
    expect(created.map((prompt) => prompt.name).toSorted()).toEqual(
      [ANSWER_PROMPT_NAME, SORT_PROMPT_NAME].toSorted(),
    );
    const answer = promptNamed(created, ANSWER_PROMPT_NAME);
    const sort = promptNamed(created, SORT_PROMPT_NAME);
    expect(nodePrompt(version?.flow, AGENT_NODE_ID)).toEqual(library(refOf(answer)));
    expect(nodePrompt(version?.flow, COMPLETION_NODE_ID)).toEqual(library(refOf(sort)));
    expect(nodePrompt(version?.flow, LIBRARY_NODE_ID)).toEqual(library(EXISTING_PROMPT_REF));
    const folder = await importedFolder(workspaceId);
    expect(answer.folderId).toBe(folder?.id);
    expect(sort.folderId).toBe(folder?.id);
    expect(await latestVersion(workspaceId, answer.id)).toMatchObject({
      number: FIRST_PROMPT_VERSION_NUMBER,
      text: AGENT_PROMPT_TEXT,
      note: IMPORTED_PROMPT_NOTE,
      authorId: null,
    });
    expect((await latestVersion(workspaceId, sort.id))?.text).toBe(COMPLETION_PROMPT_TEXT);
    expect(version?.revision).toBe(DRAFT_REVISION_AFTER_BACKFILL);
  });

  it('rewrites the draft, the published version and the snapshot with one prompt per step', async () => {
    const workspaceId = ids.generate();
    const { agentId, draftId } = await seedAgentWithDraft(
      testingModule,
      workspaceId,
      flowWithInlineSteps(),
    );
    const publishedId = await seedPublishedVersion(testingModule, workspaceId, agentId, {
      flow: flowWithInlineSteps(),
    });
    const snapshotId = await seedAgentVersion(testingModule, workspaceId, agentId, {
      kind: AgentVersionKind.Snapshot,
      flow: flowWithInlineSteps(),
    });

    const counts = await backfill.backfillWorkspace(workspaceId);

    expect(counts).toEqual({ versions: THREE_VERSIONS, prompts: TWO_PROMPTS });
    for (const versionId of [draftId, publishedId, snapshotId]) {
      const version = await readVersion(testingModule, workspaceId, versionId);
      expect(nodePrompt(version?.flow, AGENT_NODE_ID)?.kind).toBe(PromptSourceKind.Library);
      expect(nodePrompt(version?.flow, COMPLETION_NODE_ID)?.kind).toBe(PromptSourceKind.Library);
    }
  });

  it('numbers the name when two steps of one agent share a label', async () => {
    const workspaceId = ids.generate();
    const { draftId } = await seedAgentWithDraft(
      testingModule,
      workspaceId,
      stepFlow(
        [
          labelled(
            agentNode(FIRST_NODE_ID, 'first', { prompt: inline(AGENT_PROMPT_TEXT) }),
            AGENT_NODE_LABEL,
          ),
          labelled(
            agentNode(SECOND_NODE_ID, 'second', { prompt: inline(COMPLETION_PROMPT_TEXT) }),
            AGENT_NODE_LABEL,
          ),
        ],
        [flowEdge(TEST_NODE_ID, FIRST_NODE_ID)],
      ),
    );

    const counts = await backfill.backfillWorkspace(workspaceId);

    expect(counts).toEqual({ versions: 1, prompts: TWO_PROMPTS });
    const created = await listPrompts(workspaceId);
    expect(created.map((prompt) => prompt.name).toSorted()).toEqual(
      [ANSWER_PROMPT_NAME, NUMBERED_ANSWER_PROMPT_NAME].toSorted(),
    );
    const version = await readVersion(testingModule, workspaceId, draftId);
    expect(nodePrompt(version?.flow, FIRST_NODE_ID)).toEqual(
      library(refOf(promptNamed(created, ANSWER_PROMPT_NAME))),
    );
    expect(nodePrompt(version?.flow, SECOND_NODE_ID)).toEqual(
      library(refOf(promptNamed(created, NUMBERED_ANSWER_PROMPT_NAME))),
    );
  });

  it('leaves a second run and other workspaces alone', async () => {
    const workspaceId = ids.generate();
    const otherWorkspaceId = ids.generate();
    await seedAgentWithDraft(testingModule, workspaceId, flowWithInlineSteps());
    const { draftId: otherDraftId } = await seedAgentWithDraft(
      testingModule,
      otherWorkspaceId,
      flowWithInlineSteps(),
    );

    await backfill.backfillWorkspace(workspaceId);
    const second = await backfill.backfillWorkspace(workspaceId);

    expect(second).toEqual(NO_CHANGES);
    const other = await readVersion(testingModule, otherWorkspaceId, otherDraftId);
    expect(nodePrompt(other?.flow, AGENT_NODE_ID)?.kind).toBe(PromptSourceKind.Inline);
    expect(await listPrompts(otherWorkspaceId)).toEqual([]);
  });
});
