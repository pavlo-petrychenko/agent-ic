import { Injectable } from '@nestjs/common';
import { AgentVersionKind } from '@/modules/agents/constants/agent.constants';
import { EXAMPLE_VERSION_NOTE } from '@/modules/agents/constants/flow-example-nodes.constants';
import { flowExamples } from '@/modules/agents/constants/flow-examples.constants';
import {
  SAMPLE_AGENT_DESCRIPTION,
  SAMPLE_AGENT_NAME,
  SAMPLE_AGENT_NOTE,
  SAMPLE_FIRST_PAGE_SIZE,
} from '@/modules/agents/constants/sample-agent.constants';
import { buildExampleFlow } from '@/modules/agents/helpers/flow-example-nodes.helpers';
import { sampleAgentFlow } from '@/modules/agents/helpers/sample-agent.helpers';
import { AgentVersionsRepository } from '@/modules/agents/repositories/agent-versions.repository';
import { AgentsRepository } from '@/modules/agents/repositories/agents.repository';
import { AgentPublishingService } from '@/modules/agents/services/agent-publishing.service';
import type { SampleLiveAgent } from '@/modules/agents/typedefs/sample-agent.typedefs';
import type { SamplePromptRefs } from '@/modules/agents/typedefs/sample-prompt.typedefs';
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
      if (await this.hasAgents(workspaceId)) {
        return false;
      }
      await this.createLive(workspaceId, authorId, {
        name: SAMPLE_AGENT_NAME,
        description: SAMPLE_AGENT_DESCRIPTION,
        note: SAMPLE_AGENT_NOTE,
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
      });
      return true;
    });
  }

  ensureFlowExamples(
    workspaceId: string,
    authorId: string,
    promptRefs: SamplePromptRefs,
  ): Promise<boolean> {
    return this.tenantTransactions.run(workspaceId, async () => {
      if (await this.hasAgents(workspaceId)) {
        return false;
      }
      for (const example of flowExamples(promptRefs)) {
        await this.createLive(workspaceId, authorId, {
          name: example.name,
          description: example.description,
          note: EXAMPLE_VERSION_NOTE,
          flow: buildExampleFlow(example, () => this.ids.generate()),
        });
      }
      return true;
    });
  }

  private async hasAgents(workspaceId: string): Promise<boolean> {
    const existing = await this.agents.listPage(workspaceId, null, SAMPLE_FIRST_PAGE_SIZE);
    return existing.length > 0;
  }

  private async createLive(
    workspaceId: string,
    authorId: string,
    agent: SampleLiveAgent,
  ): Promise<void> {
    const now = this.clock.now();
    const agentId = this.ids.generate();
    const draftId = this.ids.generate();
    await this.agents.insert({
      id: agentId,
      workspaceId,
      name: agent.name,
      description: agent.description,
      draftVersionId: null,
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
      flow: agent.flow,
      authorId,
      createdAt: now,
      updatedAt: now,
    });
    await this.agents.setDraftVersion(workspaceId, agentId, draftId, now);
    await this.publishing.publish(workspaceId, agentId, { authorId, note: agent.note });
  }
}
