import { Injectable } from '@nestjs/common';
import { AgentVersionKind } from '@/modules/agents/constants/agent.constants';
import {
  SAMPLE_AGENT_DESCRIPTION,
  SAMPLE_AGENT_NAME,
  SAMPLE_AGENT_NOTE,
  SAMPLE_FIRST_PAGE_SIZE,
} from '@/modules/agents/constants/sample-agent.constants';
import { sampleAgentFlow } from '@/modules/agents/helpers/sample-agent.helpers';
import { AgentVersionsRepository } from '@/modules/agents/repositories/agent-versions.repository';
import { AgentsRepository } from '@/modules/agents/repositories/agents.repository';
import { AgentPublishingService } from '@/modules/agents/services/agent-publishing.service';
import { ClockService } from '@/platform/clock/services/clock.service';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { IdService } from '@/platform/ids/services/id.service';

@Injectable()
export class SampleAgentService {
  constructor(
    private readonly tenantTransactions: TenantTransactionService,
    private readonly agents: AgentsRepository,
    private readonly versions: AgentVersionsRepository,
    private readonly publishing: AgentPublishingService,
    private readonly clock: ClockService,
    private readonly ids: IdService,
  ) {}

  ensure(workspaceId: string, authorId: string): Promise<boolean> {
    return this.tenantTransactions.run(workspaceId, async () => {
      const existing = await this.agents.listPage(workspaceId, null, SAMPLE_FIRST_PAGE_SIZE);
      if (existing.length > 0) {
        return false;
      }
      const now = this.clock.now();
      const agentId = this.ids.generate();
      const draftId = this.ids.generate();
      await this.agents.insert({
        id: agentId,
        workspaceId,
        name: SAMPLE_AGENT_NAME,
        description: SAMPLE_AGENT_DESCRIPTION,
        draftVersionId: draftId,
        liveVersionId: null,
        pausedAt: null,
        pauseMode: null,
        awayMessage: null,
        createdAt: now,
        updatedAt: now,
      });
      await this.versions.insert({
        id: draftId,
        workspaceId,
        agentId,
        kind: AgentVersionKind.Draft,
        flow: sampleAgentFlow({
          nodes: {
            trigger: this.ids.generate(),
            route: this.ids.generate(),
            greeting: this.ids.generate(),
            handOff: this.ids.generate(),
          },
          rule: this.ids.generate(),
          edges: [this.ids.generate(), this.ids.generate(), this.ids.generate()],
        }),
        authorId,
        createdAt: now,
        updatedAt: now,
      });
      await this.publishing.publish(workspaceId, agentId, {
        authorId,
        note: SAMPLE_AGENT_NOTE,
      });
      return true;
    });
  }
}
