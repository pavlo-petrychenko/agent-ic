import { Injectable } from '@nestjs/common';
import { AgentNotFoundError } from '@/modules/agents/errors/agent-not-found.error';
import { AgentVersionImmutableError } from '@/modules/agents/errors/agent-version-immutable.error';
import { AgentVersionNotFoundError } from '@/modules/agents/errors/agent-version-not-found.error';
import { DraftConflictError } from '@/modules/agents/errors/draft-conflict.error';
import { AgentVersionsRepository } from '@/modules/agents/repositories/agent-versions.repository';
import { AgentsRepository } from '@/modules/agents/repositories/agents.repository';
import { AgentFlowService } from '@/modules/agents/services/agent-flow.service';
import { AgentViewsService } from '@/modules/agents/services/agent-views.service';
import type {
  AgentDraftView,
  DraftChanges,
  LockedDraft,
} from '@/modules/agents/typedefs/agent-version.typedefs';
import { ClockService } from '@/platform/clock/services/clock.service';

@Injectable()
export class AgentDraftsService {
  constructor(
    private readonly agents: AgentsRepository,
    private readonly versions: AgentVersionsRepository,
    private readonly flows: AgentFlowService,
    private readonly views: AgentViewsService,
    private readonly clock: ClockService,
  ) {}

  async lock(workspaceId: string, agentId: string, revision: number): Promise<LockedDraft> {
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
    if (draft.revision !== revision) {
      const current = await this.views.versionView(agent, draft);
      throw new DraftConflictError(current.author?.name ?? null, draft.updatedAt);
    }
    return { agent, draft };
  }

  async save(
    workspaceId: string,
    { agent, draft }: LockedDraft,
    changes: DraftChanges,
  ): Promise<AgentDraftView> {
    const now = this.clock.now();
    const saved = await this.versions.updateDraft(
      workspaceId,
      draft.id,
      draft.revision,
      changes,
      now,
    );
    if (saved === null) {
      throw new AgentVersionImmutableError();
    }
    return {
      version: await this.views.versionView(agent, {
        ...draft,
        ...changes,
        revision: saved,
        updatedAt: now,
      }),
      revision: saved,
      savedAt: now,
      issues: this.flows.validate(changes.flow),
    };
  }
}
