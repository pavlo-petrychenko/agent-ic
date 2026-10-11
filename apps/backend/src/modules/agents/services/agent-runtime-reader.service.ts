import { Injectable } from '@nestjs/common';
import { AgentVersionKind } from '@/modules/agents/constants/agent.constants';
import { AgentNotFoundError } from '@/modules/agents/errors/agent-not-found.error';
import { AgentVersionNotFoundError } from '@/modules/agents/errors/agent-version-not-found.error';
import { copyDraftToVersion } from '@/modules/agents/helpers/agent-version.helpers';
import { pauseSettingsOf } from '@/modules/agents/helpers/pause-settings.helpers';
import { AgentVersionsRepository } from '@/modules/agents/repositories/agent-versions.repository';
import { AgentsRepository } from '@/modules/agents/repositories/agents.repository';
import type { AgentVersion } from '@/modules/agents/typedefs/agent-version.typedefs';
import type { Agent } from '@/modules/agents/typedefs/agent.typedefs';
import type { PauseSettings } from '@/modules/agents/typedefs/pause-settings.typedefs';
import { ClockService } from '@/platform/clock/services/clock.service';
import { IdService } from '@/platform/ids/services/id.service';

@Injectable()
export class AgentRuntimeReader {
  constructor(
    private readonly agents: AgentsRepository,
    private readonly versions: AgentVersionsRepository,
    private readonly clock: ClockService,
    private readonly ids: IdService,
  ) {}

  async getLiveVersion(workspaceId: string, agentId: string): Promise<AgentVersion | null> {
    const agent = await this.requireAgent(workspaceId, agentId);
    return agent.liveVersionId === null ? null : this.getVersion(workspaceId, agent.liveVersionId);
  }

  async getVersion(workspaceId: string, versionId: string): Promise<AgentVersion> {
    const version = await this.versions.findById(workspaceId, versionId);
    if (version === null) {
      throw new AgentVersionNotFoundError();
    }
    return version;
  }

  async getPauseSettings(workspaceId: string, agentId: string): Promise<PauseSettings | null> {
    return pauseSettingsOf(await this.requireAgent(workspaceId, agentId));
  }

  async findAnsweringVersionId(workspaceId: string, agentId: string): Promise<string | null> {
    const agent = await this.agents.findById(workspaceId, agentId);
    return agent === null || pauseSettingsOf(agent) !== null ? null : agent.liveVersionId;
  }

  async snapshotDraft(workspaceId: string, agentId: string): Promise<AgentVersion> {
    const draft = await this.versions.findDraft(workspaceId, agentId);
    if (draft === null) {
      throw new AgentVersionNotFoundError();
    }
    const snapshot = copyDraftToVersion(draft, {
      id: this.ids.generate(),
      kind: AgentVersionKind.Snapshot,
      number: null,
      authorId: null,
      publishedAt: null,
      at: this.clock.now(),
    });
    await this.versions.insert(snapshot);
    return snapshot;
  }

  private async requireAgent(workspaceId: string, agentId: string): Promise<Agent> {
    const agent = await this.agents.findById(workspaceId, agentId);
    if (agent === null) {
      throw new AgentNotFoundError();
    }
    return agent;
  }
}
