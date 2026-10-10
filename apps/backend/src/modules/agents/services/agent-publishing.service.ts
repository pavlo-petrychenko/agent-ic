import { Injectable } from '@nestjs/common';
import { AgentVersionKind } from '@/modules/agents/constants/agent.constants';
import { AgentFlowHasBlockingIssuesError } from '@/modules/agents/errors/agent-flow-has-blocking-issues.error';
import { AgentNotFoundError } from '@/modules/agents/errors/agent-not-found.error';
import { AgentVersionNotFoundError } from '@/modules/agents/errors/agent-version-not-found.error';
import { copyDraftToVersion } from '@/modules/agents/helpers/agent-version.helpers';
import { AgentVersionsRepository } from '@/modules/agents/repositories/agent-versions.repository';
import { AgentsRepository } from '@/modules/agents/repositories/agents.repository';
import { AgentFlowService } from '@/modules/agents/services/agent-flow.service';
import type { AgentVersion } from '@/modules/agents/typedefs/agent-version.typedefs';
import { ClockService } from '@/platform/clock/services/clock.service';
import { IdService } from '@/platform/ids/services/id.service';

@Injectable()
export class AgentPublishingService {
  constructor(
    private readonly agents: AgentsRepository,
    private readonly versions: AgentVersionsRepository,
    private readonly flows: AgentFlowService,
    private readonly clock: ClockService,
    private readonly ids: IdService,
  ) {}

  async publish(workspaceId: string, agentId: string, authorId: string): Promise<AgentVersion> {
    const agent = await this.agents.findByIdForUpdate(workspaceId, agentId);
    if (agent === null) {
      throw new AgentNotFoundError();
    }
    const draft =
      agent.draftVersionId === null
        ? null
        : await this.versions.findById(workspaceId, agent.draftVersionId);
    if (draft === null) {
      throw new AgentVersionNotFoundError();
    }
    if (this.flows.hasBlockingIssues(this.flows.validate(draft.flow))) {
      throw new AgentFlowHasBlockingIssuesError();
    }
    const now = this.clock.now();
    const lastNumber = await this.versions.lastPublishedNumber(workspaceId, agentId);
    const published = copyDraftToVersion(draft, {
      id: this.ids.generate(),
      kind: AgentVersionKind.Published,
      number: lastNumber + 1,
      authorId,
      publishedAt: now,
      at: now,
    });
    await this.versions.insert(published);
    await this.versions.setBaseVersion(workspaceId, draft.id, published.id);
    await this.agents.setLiveVersion(workspaceId, agentId, published.id, now);
    return published;
  }
}
