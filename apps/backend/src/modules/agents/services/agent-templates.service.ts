import { FlowIssueCode, agentTemplate, buildAgentTemplate } from '@agent-ic/flow';
import type { FlowDocument } from '@agent-ic/flow';
import { Injectable } from '@nestjs/common';
import { AgentVersionKind } from '@/modules/agents/constants/agent.constants';
import { AgentNotFoundError } from '@/modules/agents/errors/agent-not-found.error';
import { AgentTemplateWithoutKnowledgeError } from '@/modules/agents/errors/agent-template-without-knowledge.error';
import { TemplateKnowledgeBaseNotFoundError } from '@/modules/agents/errors/template-knowledge-base-not-found.error';
import { uniqueAgentName } from '@/modules/agents/helpers/agent-name.helpers';
import { templatePromptRequest } from '@/modules/agents/helpers/agent-template.helpers';
import { AgentVersionsRepository } from '@/modules/agents/repositories/agent-versions.repository';
import { AgentsRepository } from '@/modules/agents/repositories/agents.repository';
import { FlowReferenceChecksService } from '@/modules/agents/services/flow-reference-checks.service';
import { TemplatePromptsService } from '@/modules/agents/services/template-prompts.service';
import type { AgentTemplateCreation } from '@/modules/agents/typedefs/agent-template.typedefs';
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
    private readonly references: FlowReferenceChecksService,
    private readonly ids: IdService,
  ) {}

  async create(creation: AgentTemplateCreation): Promise<Agent> {
    const { workspaceId, authorId, locale, key, knowledgeBaseIds } = creation;
    const template = agentTemplate(key);
    if (knowledgeBaseIds.length > 0 && !template.usesKnowledge) {
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
    const flow = buildAgentTemplate(key, {
      locale,
      promptRefs,
      knowledgeBaseIds,
      timeZone: workspace.timeZone,
      models: {
        agent: LLM_DEFAULT_MODEL[LlmPurpose.Conversation],
        completion: LLM_DEFAULT_MODEL[LlmPurpose.Light],
      },
      nextId: () => this.ids.generate(),
    });
    await this.requireKnowledgeBases(workspaceId, flow, knowledgeBaseIds);
    return this.insertAgent(
      creation,
      creation.name ?? template.name[locale],
      template.description[locale],
      flow,
    );
  }

  private async requireKnowledgeBases(
    workspaceId: string,
    flow: FlowDocument,
    knowledgeBaseIds: readonly string[],
  ): Promise<void> {
    if (knowledgeBaseIds.length === 0) {
      return;
    }
    const issues = await this.references.check(workspaceId, flow);
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
