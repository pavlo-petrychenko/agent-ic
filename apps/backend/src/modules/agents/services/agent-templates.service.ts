import { FlowIssueCode, agentTemplate, buildAgentTemplate } from '@agent-ic/flow';
import type { AgentTemplateKey, AgentTemplateOptions, FlowDocument } from '@agent-ic/flow';
import { Injectable } from '@nestjs/common';
import { AgentVersionKind } from '@/modules/agents/constants/agent.constants';
import { AgentNotFoundError } from '@/modules/agents/errors/agent-not-found.error';
import { AgentTemplateUnknownKnowledgeRoleError } from '@/modules/agents/errors/agent-template-unknown-knowledge-role.error';
import { AgentTemplateWithoutKnowledgeError } from '@/modules/agents/errors/agent-template-without-knowledge.error';
import { TemplateKnowledgeBaseNotFoundError } from '@/modules/agents/errors/template-knowledge-base-not-found.error';
import { uniqueAgentName } from '@/modules/agents/helpers/agent-name.helpers';
import {
  requestedKnowledgeRoles,
  templateKnowledgeBaseIds,
  templatePromptRequest,
  undeclaredKnowledgeRoles,
  withCreatedKnowledgeBases,
} from '@/modules/agents/helpers/agent-template.helpers';
import { AgentVersionsRepository } from '@/modules/agents/repositories/agent-versions.repository';
import { AgentsRepository } from '@/modules/agents/repositories/agents.repository';
import { FlowReferenceChecksService } from '@/modules/agents/services/flow-reference-checks.service';
import { TemplateKnowledgeBasesService } from '@/modules/agents/services/template-knowledge-bases.service';
import { TemplatePromptsService } from '@/modules/agents/services/template-prompts.service';
import type {
  AgentTemplateCreation,
  CreatedTemplateKnowledgeBase,
} from '@/modules/agents/typedefs/agent-template.typedefs';
import type { Agent } from '@/modules/agents/typedefs/agent.typedefs';
import { WorkspacesRepository } from '@/modules/identity';
import { WorkspaceAccessDeniedError } from '@/platform/context/errors/workspace-access-denied.error';
import { IdService } from '@/platform/ids/services/id.service';
import { LLM_DEFAULT_MODEL } from '@/platform/llm/constants/llm-catalog.constants';
import { LlmPurpose } from '@/platform/llm/constants/llm-model.constants';

@Injectable()
export class AgentTemplatesService {
  constructor(
    private readonly agents: AgentsRepository,
    private readonly versions: AgentVersionsRepository,
    private readonly workspaces: WorkspacesRepository,
    private readonly prompts: TemplatePromptsService,
    private readonly knowledgeBaseWriter: TemplateKnowledgeBasesService,
    private readonly references: FlowReferenceChecksService,
    private readonly ids: IdService,
  ) {}

  async create(creation: AgentTemplateCreation): Promise<Agent> {
    const { workspaceId, authorId, locale, key, knowledgeBaseIds, knowledgeBases } = creation;
    const template = agentTemplate(key);
    const unknownRoles = undeclaredKnowledgeRoles(
      template,
      requestedKnowledgeRoles(knowledgeBases, creation.newKnowledgeBases),
    );
    if (unknownRoles.length > 0) {
      throw new AgentTemplateUnknownKnowledgeRoleError(key, unknownRoles);
    }
    const allKnowledgeBaseIds = templateKnowledgeBaseIds(knowledgeBaseIds, knowledgeBases);
    const asksForKnowledge =
      allKnowledgeBaseIds.length > 0 || creation.newKnowledgeBases.length > 0;
    if (asksForKnowledge && !template.usesKnowledge) {
      throw new AgentTemplateWithoutKnowledgeError(key);
    }
    const workspace = await this.workspaces.findById(workspaceId);
    if (workspace === null) {
      throw new WorkspaceAccessDeniedError();
    }
    const promptRefs = await this.prompts.ensure(
      workspaceId,
      templatePromptRequest(template, locale, authorId),
    );
    const options: AgentTemplateOptions = {
      locale,
      promptRefs,
      knowledgeBaseIds,
      knowledgeBases,
      timeZone: workspace.timeZone,
      models: {
        agent: LLM_DEFAULT_MODEL[LlmPurpose.Conversation],
        completion: LLM_DEFAULT_MODEL[LlmPurpose.Light],
      },
      nextId: () => this.ids.generate(),
    };
    await this.requireKnowledgeBases(workspaceId, key, options, allKnowledgeBaseIds);
    const created = await this.createKnowledgeBases(creation);
    const flow = buildAgentTemplate(key, {
      ...options,
      ...withCreatedKnowledgeBases(knowledgeBaseIds, knowledgeBases, created),
    });
    return this.insertAgent(
      creation,
      creation.name ?? template.name[locale],
      template.description[locale],
      flow,
    );
  }

  private async createKnowledgeBases(
    creation: AgentTemplateCreation,
  ): Promise<readonly CreatedTemplateKnowledgeBase[]> {
    const created: CreatedTemplateKnowledgeBase[] = [];
    for (const { role, name } of creation.newKnowledgeBases) {
      const id = await this.knowledgeBaseWriter.create(creation.workspaceId, {
        name,
        authorId: creation.authorId,
      });
      created.push({ role, id });
    }
    return created;
  }

  private async requireKnowledgeBases(
    workspaceId: string,
    key: AgentTemplateKey,
    options: AgentTemplateOptions,
    knowledgeBaseIds: readonly string[],
  ): Promise<void> {
    if (knowledgeBaseIds.length === 0) {
      return;
    }
    const everyId = buildAgentTemplate(key, { ...options, knowledgeBaseIds, knowledgeBases: {} });
    const issues = await this.references.check(workspaceId, everyId);
    if (issues.some((issue) => issue.code === FlowIssueCode.MissingKnowledgeBase)) {
      throw new TemplateKnowledgeBaseNotFoundError(knowledgeBaseIds);
    }
  }

  private async insertAgent(
    creation: AgentTemplateCreation,
    name: string,
    description: string,
    flow: FlowDocument,
  ): Promise<Agent> {
    const { workspaceId, authorId } = creation;
    const agentId = this.ids.generate();
    const draftId = this.ids.generate();
    await this.agents.lockNames(workspaceId);
    const takenNames = await this.agents.findNamesStartingWith(workspaceId, name);
    await this.agents.insert({
      id: agentId,
      workspaceId,
      name: uniqueAgentName(name, takenNames),
      description,
      draftVersionId: null,
      liveVersionId: null,
      pausedAt: null,
      pauseMode: null,
      awayMessage: null,
    });
    await this.versions.insert({
      id: draftId,
      workspaceId,
      agentId,
      kind: AgentVersionKind.Draft,
      flow,
      authorId,
    });
    const agent = await this.agents.setDraftVersion(workspaceId, agentId, draftId);
    if (agent === null) {
      throw new AgentNotFoundError();
    }
    return agent;
  }
}
