import { IdPrefix } from '@agent-ic/contracts';
import { countFlowChanges, diffFlows } from '@agent-ic/flow';
import { Injectable } from '@nestjs/common';
import { EMPTY_FLOW } from '@/modules/agents/constants/agent.constants';
import { AgentNotFoundError } from '@/modules/agents/errors/agent-not-found.error';
import {
  agentVersionStatusOf,
  authorIdsOf,
  toAgentVersionView,
} from '@/modules/agents/helpers/agent-version.helpers';
import { toAgentView } from '@/modules/agents/helpers/agent-view.helpers';
import { AgentVersionsRepository } from '@/modules/agents/repositories/agent-versions.repository';
import type {
  AgentVersion,
  AgentVersionView,
} from '@/modules/agents/typedefs/agent-version.typedefs';
import type { Agent, AgentView } from '@/modules/agents/typedefs/agent.typedefs';
import { UsersRepository } from '@/modules/identity';
import { IdService } from '@/platform/ids/services/id.service';

@Injectable()
export class AgentViewsService {
  constructor(
    private readonly versions: AgentVersionsRepository,
    private readonly users: UsersRepository,
    private readonly ids: IdService,
  ) {}

  async agentViews(workspaceId: string, agents: readonly Agent[]): Promise<AgentView[]> {
    const summaries = await this.versions.summarize(
      workspaceId,
      agents.map((agent) => agent.id),
    );
    const byAgent = new Map(summaries.map((summary) => [summary.agentId, summary]));
    return agents.map((agent) => {
      const summary = byAgent.get(agent.id);
      if (summary === undefined) {
        throw new AgentNotFoundError();
      }
      return toAgentView(agent, this.ids.toPublic(IdPrefix.Agent, agent.id), summary);
    });
  }

  async agentView(workspaceId: string, agent: Agent): Promise<AgentView> {
    const [view] = await this.agentViews(workspaceId, [agent]);
    if (view === undefined) {
      throw new AgentNotFoundError();
    }
    return view;
  }

  async agentDetailView(workspaceId: string, agent: Agent): Promise<AgentView> {
    const view = await this.agentView(workspaceId, agent);
    const draft = await this.versions.findDraft(workspaceId, agent.id);
    const live =
      agent.liveVersionId === null
        ? null
        : await this.versions.findById(workspaceId, agent.liveVersionId);
    const diff = diffFlows(live?.flow ?? EMPTY_FLOW, draft?.flow ?? EMPTY_FLOW);
    return { ...view, draftChangeCount: countFlowChanges(diff) };
  }

  async versionViews(agent: Agent, versions: readonly AgentVersion[]): Promise<AgentVersionView[]> {
    const names = new Map(
      (await this.users.findNames(authorIdsOf(versions))).map((user) => [user.id, user.name]),
    );
    return versions.map((version) => {
      const name = version.authorId === null ? undefined : names.get(version.authorId);
      return toAgentVersionView(version, {
        id: this.ids.toPublic(IdPrefix.AgentVersion, version.id),
        status: agentVersionStatusOf(version, agent.liveVersionId),
        author: name === undefined ? null : { name },
      });
    });
  }

  async versionView(agent: Agent, version: AgentVersion): Promise<AgentVersionView> {
    const [view] = await this.versionViews(agent, [version]);
    if (view === undefined) {
      throw new AgentNotFoundError();
    }
    return view;
  }
}
