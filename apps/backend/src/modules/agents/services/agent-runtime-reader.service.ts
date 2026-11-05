import { Injectable } from '@nestjs/common';
import { AgentVersionKind } from '@/modules/agents/constants/agent.constants';
import { AgentNotFoundError } from '@/modules/agents/errors/agent-not-found.error';
import { AgentVersionNotFoundError } from '@/modules/agents/errors/agent-version-not-found.error';
import { copyDraftToVersion } from '@/modules/agents/helpers/agent-version.helpers';
import { pauseSettingsOf } from '@/modules/agents/helpers/pause-settings.helpers';
import { scheduleNodeOf } from '@/modules/agents/helpers/schedule-trigger.helpers';
import { AgentVersionsRepository } from '@/modules/agents/repositories/agent-versions.repository';
import { AgentsRepository } from '@/modules/agents/repositories/agents.repository';
import type { AgentVersion } from '@/modules/agents/typedefs/agent-version.typedefs';
import type { Agent } from '@/modules/agents/typedefs/agent.typedefs';
import type { PauseSettings } from '@/modules/agents/typedefs/pause-settings.typedefs';
import type { LiveScheduleTriggerState } from '@/modules/agents/typedefs/schedule-trigger.typedefs';
import { IdService } from '@/platform/ids/services/id.service';

@Injectable()
export class AgentRuntimeReader {
  constructor(
    private readonly agents: AgentsRepository,
    private readonly versions: AgentVersionsRepository,
    private readonly ids: IdService,
  ) {}

  async getLiveVersion(workspaceId: string, agentId: string): Promise<AgentVersion | null> {
    const agent = await this.getAgent(workspaceId, agentId);
    return agent.liveVersionId === null ? null : this.getVersion(workspaceId, agent.liveVersionId);
  }

  async getVersion(workspaceId: string, versionId: string): Promise<AgentVersion> {
    const version = await this.versions.findById(workspaceId, versionId);
    if (version === null) {
      throw new AgentVersionNotFoundError();
    }
    return version;
  }

  async getVersions(
    workspaceId: string,
    versionIds: readonly string[],
  ): Promise<ReadonlyMap<string, AgentVersion>> {
    const versions = await this.versions.listByIds(workspaceId, versionIds);
    return new Map(versions.map((version) => [version.id, version]));
  }

  async countFlowNodes(
    workspaceId: string,
    versionIds: readonly string[],
  ): Promise<ReadonlyMap<string, number>> {
    const counts = await this.versions.countFlowNodes(workspaceId, versionIds);
    return new Map(counts.map(({ versionId, nodes }) => [versionId, nodes]));
  }

  async getPublishedVersion(
    workspaceId: string,
    agentId: string,
    versionId: string,
  ): Promise<AgentVersion> {
    const version = await this.versions.findById(workspaceId, versionId);
    if (version?.agentId !== agentId || version.kind !== AgentVersionKind.Published) {
      throw new AgentVersionNotFoundError();
    }
    return version;
  }

  listSnapshotIds(workspaceId: string, agentId: string, revision: number): Promise<string[]> {
    return this.versions.listSnapshotIds(workspaceId, agentId, revision);
  }

  async getPauseSettings(workspaceId: string, agentId: string): Promise<PauseSettings | null> {
    return pauseSettingsOf(await this.getAgent(workspaceId, agentId));
  }

  async findAnsweringVersionId(workspaceId: string, agentId: string): Promise<string | null> {
    const agent = await this.agents.findById(workspaceId, agentId);
    return agent === null || pauseSettingsOf(agent) !== null ? null : agent.liveVersionId;
  }

  async findLiveScheduleTrigger(
    workspaceId: string,
    agentId: string,
    nodeId: string,
  ): Promise<LiveScheduleTriggerState | null> {
    const agent = await this.agents.findById(workspaceId, agentId);
    if (agent === null || agent.liveVersionId === null) {
      return null;
    }
    const version = await this.versions.findById(workspaceId, agent.liveVersionId);
    const node = version === null ? null : scheduleNodeOf(version.flow, nodeId);
    if (version === null || version.publishedAt === null || node === null) {
      return null;
    }
    return {
      trigger: {
        workspaceId,
        agentId,
        versionId: version.id,
        publishedAt: version.publishedAt,
        node,
      },
      paused: pauseSettingsOf(agent) !== null,
    };
  }

  async snapshotDraft(workspaceId: string, agentId: string): Promise<AgentVersion> {
    await this.getAgent(workspaceId, agentId);
    const draft = await this.versions.findDraft(workspaceId, agentId);
    if (draft === null) {
      throw new AgentVersionNotFoundError();
    }
    return this.versions.insert({
      ...copyDraftToVersion(draft, {
        id: this.ids.generate(),
        kind: AgentVersionKind.Snapshot,
        number: null,
        authorId: null,
        publishedAt: null,
      }),
      revision: draft.revision,
    });
  }

  async getAgent(workspaceId: string, agentId: string): Promise<Agent> {
    const agent = await this.agents.findById(workspaceId, agentId);
    if (agent === null) {
      throw new AgentNotFoundError();
    }
    return agent;
  }
}
