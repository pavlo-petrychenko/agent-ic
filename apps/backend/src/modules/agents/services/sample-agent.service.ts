import { agentTemplates } from '@agent-ic/flow';
import type { AgentTemplateKey } from '@agent-ic/flow';
import { Injectable } from '@nestjs/common';
import {
  SAMPLE_AGENT_NOTE,
  SAMPLE_AGENT_TEMPLATE_KEY,
  SAMPLE_FIRST_PAGE_SIZE,
  SAMPLE_LOCALE,
} from '@/modules/agents/constants/sample-agent.constants';
import { AgentsRepository } from '@/modules/agents/repositories/agents.repository';
import { AgentPublishingService } from '@/modules/agents/services/agent-publishing.service';
import { AgentTemplatesService } from '@/modules/agents/services/agent-templates.service';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';

@Injectable()
export class SampleAgentService {
  constructor(
    private readonly tenantTransactions: TenantTransactionService,
    private readonly agents: AgentsRepository,
    private readonly templates: AgentTemplatesService,
    private readonly publishing: AgentPublishingService,
  ) {}

  ensure(workspaceId: string, authorId: string): Promise<boolean> {
    return this.ensureLive(workspaceId, authorId, [SAMPLE_AGENT_TEMPLATE_KEY]);
  }

  ensureFlowExamples(workspaceId: string, authorId: string): Promise<boolean> {
    return this.ensureLive(
      workspaceId,
      authorId,
      agentTemplates.map((template) => template.key),
    );
  }

  private ensureLive(
    workspaceId: string,
    authorId: string,
    keys: readonly AgentTemplateKey[],
  ): Promise<boolean> {
    return this.tenantTransactions.run(workspaceId, async () => {
      const existing = await this.agents.listPage(workspaceId, null, SAMPLE_FIRST_PAGE_SIZE);
      if (existing.length > 0) {
        return false;
      }
      for (const key of keys) {
        const agent = await this.templates.create({
          workspaceId,
          authorId,
          locale: SAMPLE_LOCALE,
          key,
          name: null,
          knowledgeBaseIds: [],
        });
        await this.publishing.publish(workspaceId, agent.id, {
          authorId,
          note: SAMPLE_AGENT_NOTE,
        });
      }
      return true;
    });
  }
}
