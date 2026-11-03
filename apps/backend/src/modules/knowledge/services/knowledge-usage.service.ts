import { IdPrefix } from '@agent-ic/contracts';
import { knowledgeBaseReferences } from '@agent-ic/flow';
import type { KnowledgeBaseReference } from '@agent-ic/flow';
import { Injectable } from '@nestjs/common';
import { AgentVersionKind, AgentVersionsRepository } from '@/modules/agents';
import type { CurrentAgentFlow } from '@/modules/agents';
import { KnowledgeBaseUsageVersionKind } from '@/modules/knowledge/constants/knowledge-usage.constants';
import type { KnowledgeBaseUsage } from '@/modules/knowledge/typedefs/knowledge-base-usage.typedefs';
import { IdService } from '@/platform/ids/services/id.service';

@Injectable()
export class KnowledgeUsageService {
  constructor(
    private readonly flows: AgentVersionsRepository,
    private readonly ids: IdService,
  ) {}

  async listForKnowledgeBase(
    workspaceId: string,
    knowledgeBaseId: string,
  ): Promise<readonly KnowledgeBaseUsage[]> {
    const current = await this.flows.listCurrentFlows(workspaceId);
    return current.flatMap((entry) =>
      knowledgeBaseReferences(entry.flow)
        .filter(
          (reference) =>
            this.ids.tryFromPublic(IdPrefix.KnowledgeBase, reference.knowledgeBaseId) ===
            knowledgeBaseId,
        )
        .map((reference) => this.usageOf(entry, reference)),
    );
  }

  private usageOf(entry: CurrentAgentFlow, reference: KnowledgeBaseReference): KnowledgeBaseUsage {
    return {
      agentId: this.ids.toPublic(IdPrefix.Agent, entry.agentId),
      agentName: entry.agentName,
      versionId: this.ids.toPublic(IdPrefix.AgentVersion, entry.versionId),
      versionKind:
        entry.versionKind === AgentVersionKind.Draft
          ? KnowledgeBaseUsageVersionKind.Draft
          : KnowledgeBaseUsageVersionKind.Live,
      versionNumber: entry.versionNumber,
      nodeId: reference.nodeId,
      nodeKey: reference.nodeKey,
      nodeLabel: reference.nodeLabel === '' ? reference.nodeKey : reference.nodeLabel,
    };
  }
}
