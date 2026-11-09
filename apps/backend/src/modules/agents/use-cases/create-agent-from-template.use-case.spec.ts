import {
  IdPrefix,
  Locale,
  PermissionAction,
  PermissionResource,
  WorkspaceRole,
  permissionKey,
  permissionsForRole,
} from '@agent-ic/contracts';
import {
  AgentTemplateKey,
  NodeType,
  agentTemplate,
  agentTemplates,
  buildAgentTemplate,
  hasBlockingIssues,
  validateFlow,
} from '@agent-ic/flow';
import type { FlowDocument } from '@agent-ic/flow';
import type { TestingModule } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { TEMPLATE_PROMPT_FOLDER_NAME } from '@/modules/agents/constants/agent-template.constants';
import { AgentStatus } from '@/modules/agents/constants/agent.constants';
import { AgentTemplateWithoutKnowledgeError } from '@/modules/agents/errors/agent-template-without-knowledge.error';
import { InvalidAgentInputError } from '@/modules/agents/errors/invalid-agent-input.error';
import { TemplateKnowledgeBaseNotFoundError } from '@/modules/agents/errors/template-knowledge-base-not-found.error';
import { AgentVersionsRepository } from '@/modules/agents/repositories/agent-versions.repository';
import { AgentsRepository } from '@/modules/agents/repositories/agents.repository';
import { AgentPublishingService } from '@/modules/agents/services/agent-publishing.service';
import { CreateAgentFromTemplateUseCase } from '@/modules/agents/use-cases/create-agent-from-template.use-case';
import { PermissionDeniedError } from '@/platform/context/errors/permission-denied.error';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { IdService } from '@/platform/ids/services/id.service';
import {
  TEST_EDITOR_ID,
  TEST_TEMPLATE_AGENT_NAME,
  TEST_UNKNOWN_KNOWLEDGE_BASE_ID,
} from '@test/support/constants/agents-testing.constants';
import { TEST_TIME_ZONE } from '@test/support/constants/workspace-testing.constants';
import {
  createAgentTemplatesTestingModule,
  findPromptFolder,
  listWorkspacePrompts,
  seedTemplateKnowledgeBase,
} from '@test/support/helpers/agent-templates-testing.helpers';
import { agentsCtx } from '@test/support/helpers/agents-testing.helpers';
import { ensureWorkspaceRow } from '@test/support/helpers/parent-rows.helpers';

const SECOND_NAME_SUFFIX = ' 2';
const FIRST_VERSION_NUMBER = 1;

const knowledgeNodeIds = (flow: FlowDocument | undefined): (readonly string[])[] =>
  (flow?.nodes ?? []).flatMap((node) =>
    node.type === NodeType.Agent && node.config.knowledgeBaseIds.length > 0
      ? [node.config.knowledgeBaseIds]
      : [],
  );

describe('CreateAgentFromTemplateUseCase', () => {
  let testingModule: TestingModule;
  let createFromTemplate: CreateAgentFromTemplateUseCase;
  let tenants: TenantTransactionService;
  let ids: IdService;

  const newWorkspace = async (): Promise<string> => {
    const workspaceId = ids.generate();
    await ensureWorkspaceRow(testingModule, workspaceId);
    return workspaceId;
  };

  const readStored = (workspaceId: string, publicId: string) =>
    tenants.run(workspaceId, async () => {
      const agentId = ids.fromPublic(IdPrefix.Agent, publicId);
      const agent = await testingModule.get(AgentsRepository).findById(workspaceId, agentId);
      const draft = await testingModule
        .get(AgentVersionsRepository)
        .findDraft(workspaceId, agentId);
      return { agentId, agent, draft };
    });

  const listPrompts = (workspaceId: string) => listWorkspacePrompts(testingModule, workspaceId);

  beforeAll(async () => {
    testingModule = await createAgentTemplatesTestingModule();
    createFromTemplate = testingModule.get(CreateAgentFromTemplateUseCase);
    tenants = testingModule.get(TenantTransactionService);
    ids = testingModule.get(IdService);
  });

  afterAll(async () => {
    await testingModule.close();
  });

  it.each(agentTemplates.map((template) => template.key))(
    'creates %s as a draft that publishes with no blocking issue',
    async (templateKey) => {
      const workspaceId = await newWorkspace();
      const template = agentTemplate(templateKey);

      const view = await createFromTemplate.execute(
        agentsCtx(testingModule, workspaceId, WorkspaceRole.Builder),
        { templateKey },
      );

      const { agentId, agent, draft } = await readStored(workspaceId, view.id);
      const published = await tenants.run(workspaceId, () =>
        testingModule
          .get(AgentPublishingService)
          .publish(workspaceId, agentId, { authorId: TEST_EDITOR_ID }),
      );
      expect(view).toMatchObject({
        name: template.name.en,
        description: template.description.en,
        status: AgentStatus.Draft,
      });
      expect(agent?.draftVersionId).toBe(draft?.id);
      expect(hasBlockingIssues(validateFlow(draft?.flow))).toBe(false);
      expect(published.number).toBe(FIRST_VERSION_NUMBER);
      expect((await listPrompts(workspaceId)).map((prompt) => prompt.name).toSorted()).toEqual(
        template.prompts.map((prompt) => prompt.name.en).toSorted(),
      );
    },
  );

  it('uses the request locale for the name, the labels and the prompt folder', async () => {
    const workspaceId = await newWorkspace();
    const key = AgentTemplateKey.CafeSupport;
    const ctx: UseCaseCtx = { ...agentsCtx(testingModule, workspaceId), locale: Locale.Uk };

    const view = await createFromTemplate.execute(ctx, { templateKey: key });

    const { draft } = await readStored(workspaceId, view.id);
    const expected = buildAgentTemplate(key, {
      locale: Locale.Uk,
      promptRefs: {},
      knowledgeBaseIds: [],
      timeZone: TEST_TIME_ZONE,
      models: { agent: '', completion: '' },
      nextId: () => ids.generate(),
    });
    const folder = await findPromptFolder(
      testingModule,
      workspaceId,
      TEMPLATE_PROMPT_FOLDER_NAME.uk,
    );
    const prompts = await listPrompts(workspaceId);
    expect(view.name).toBe(agentTemplate(key).name.uk);
    expect(draft?.flow.nodes.map((node) => node.label)).toEqual(
      expected.nodes.map((node) => node.label),
    );
    expect(prompts.map((prompt) => prompt.folderId)).toEqual(
      agentTemplate(key).prompts.map(() => folder?.id),
    );
    expect(prompts.map((prompt) => prompt.name).toSorted()).toEqual(
      agentTemplate(key)
        .prompts.map((prompt) => prompt.name.uk)
        .toSorted(),
    );
  });

  it('reuses the prompts and numbers the name on a second create', async () => {
    const workspaceId = await newWorkspace();
    const ctx = agentsCtx(testingModule, workspaceId);
    const templateKey = AgentTemplateKey.StoreSales;

    const first = await createFromTemplate.execute(ctx, { templateKey });
    const promptsAfterFirst = await listPrompts(workspaceId);
    const second = await createFromTemplate.execute(ctx, { templateKey });

    const firstDraft = (await readStored(workspaceId, first.id)).draft;
    const secondDraft = (await readStored(workspaceId, second.id)).draft;
    const refsOf = (flow: FlowDocument | undefined) =>
      (flow?.nodes ?? []).flatMap((node) =>
        (node.type === NodeType.Agent || node.type === NodeType.Completion) &&
        node.config.prompt !== null
          ? [node.config.prompt.promptRef]
          : [],
      );
    expect(second.name).toBe(`${first.name}${SECOND_NAME_SUFFIX}`);
    expect(await listPrompts(workspaceId)).toHaveLength(promptsAfterFirst.length);
    expect(refsOf(secondDraft?.flow)).toEqual(refsOf(firstDraft?.flow));
  });

  it('takes the given name', async () => {
    const workspaceId = await newWorkspace();

    const view = await createFromTemplate.execute(agentsCtx(testingModule, workspaceId), {
      templateKey: AgentTemplateKey.CafeSupport,
      name: TEST_TEMPLATE_AGENT_NAME,
    });

    expect(view.name).toBe(TEST_TEMPLATE_AGENT_NAME);
  });

  it('puts the knowledge bases on the answering steps and publishes', async () => {
    const workspaceId = await newWorkspace();
    const knowledgeBaseId = ids.toPublic(
      IdPrefix.KnowledgeBase,
      await seedTemplateKnowledgeBase(testingModule, workspaceId),
    );

    const view = await createFromTemplate.execute(agentsCtx(testingModule, workspaceId), {
      templateKey: AgentTemplateKey.CafeSupport,
      knowledgeBaseIds: [knowledgeBaseId, knowledgeBaseId],
    });

    const { agentId, draft } = await readStored(workspaceId, view.id);
    const published = await tenants.run(workspaceId, () =>
      testingModule
        .get(AgentPublishingService)
        .publish(workspaceId, agentId, { authorId: TEST_EDITOR_ID }),
    );
    const knowledgeSteps = knowledgeNodeIds(draft?.flow);
    expect(knowledgeSteps.length).toBeGreaterThan(0);
    expect(knowledgeSteps.every((stepIds) => stepIds.join() === knowledgeBaseId)).toBe(true);
    expect(published.number).toBe(FIRST_VERSION_NUMBER);
  });

  it('refuses knowledge bases for a template that does not use them', async () => {
    const workspaceId = await newWorkspace();
    const knowledgeBaseId = ids.toPublic(
      IdPrefix.KnowledgeBase,
      await seedTemplateKnowledgeBase(testingModule, workspaceId),
    );

    const attempt = createFromTemplate.execute(agentsCtx(testingModule, workspaceId), {
      templateKey: AgentTemplateKey.MenuButtons,
      knowledgeBaseIds: [knowledgeBaseId],
    });

    await expect(attempt).rejects.toBeInstanceOf(AgentTemplateWithoutKnowledgeError);
  });

  it('refuses an unknown knowledge base and writes nothing', async () => {
    const workspaceId = await newWorkspace();

    const attempt = createFromTemplate.execute(agentsCtx(testingModule, workspaceId), {
      templateKey: AgentTemplateKey.CafeSupport,
      knowledgeBaseIds: [TEST_UNKNOWN_KNOWLEDGE_BASE_ID],
    });

    await expect(attempt).rejects.toBeInstanceOf(TemplateKnowledgeBaseNotFoundError);
    const agents = await tenants.run(workspaceId, () =>
      testingModule.get(AgentsRepository).listPage(workspaceId, null, 1),
    );
    const stored = { agents, prompts: await listPrompts(workspaceId) };
    expect(stored).toEqual({ agents: [], prompts: [] });
  });

  it('refuses an unknown template key', async () => {
    const workspaceId = await newWorkspace();

    const attempt = createFromTemplate.execute(agentsCtx(testingModule, workspaceId), {
      templateKey: TEST_UNKNOWN_KNOWLEDGE_BASE_ID,
    });

    await expect(attempt).rejects.toBeInstanceOf(InvalidAgentInputError);
  });

  it('denies a role that cannot edit agents', async () => {
    const workspaceId = await newWorkspace();

    const attempt = createFromTemplate.execute(
      agentsCtx(testingModule, workspaceId, WorkspaceRole.Operator),
      { templateKey: AgentTemplateKey.CafeSupport },
    );

    await expect(attempt).rejects.toBeInstanceOf(PermissionDeniedError);
  });

  it('denies a custom role that can edit agents but not prompts', async () => {
    const workspaceId = await newWorkspace();
    const permissions = new Set(permissionsForRole(WorkspaceRole.Builder));
    permissions.delete(permissionKey(PermissionResource.Prompts, PermissionAction.Edit));

    const attempt = createFromTemplate.execute(
      { ...agentsCtx(testingModule, workspaceId, WorkspaceRole.Builder), permissions },
      { templateKey: AgentTemplateKey.CafeSupport },
    );

    await expect(attempt).rejects.toBeInstanceOf(PermissionDeniedError);
  });
});
