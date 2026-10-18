import { IdPrefix } from '@agent-ic/contracts';
import { promptReferences } from '@agent-ic/flow';
import type { PromptReference } from '@agent-ic/flow';
import { Injectable } from '@nestjs/common';
import { AgentVersionKind, CurrentAgentFlowsReader } from '@/modules/agents';
import type { CurrentAgentFlow } from '@/modules/agents';
import { PromptUsageVersionKind } from '@/modules/prompts/constants/prompt-usage.constants';
import type { PromptUsage } from '@/modules/prompts/typedefs/prompt-usage.typedefs';
import { IdService } from '@/platform/ids/services/id.service';

@Injectable()
export class PromptUsageService {
  constructor(
    private readonly flows: CurrentAgentFlowsReader,
    private readonly ids: IdService,
  ) {}

  async listForPrompt(workspaceId: string, promptId: string): Promise<readonly PromptUsage[]> {
    const current = await this.flows.listCurrent(workspaceId);
    return current.flatMap((entry) =>
      promptReferences(entry.flow)
        .filter(
          (reference) => this.ids.tryFromPublic(IdPrefix.Prompt, reference.promptRef) === promptId,
        )
        .map((reference) => this.usageOf(entry, reference)),
    );
  }

  private usageOf(entry: CurrentAgentFlow, reference: PromptReference): PromptUsage {
    return {
      agentId: this.ids.toPublic(IdPrefix.Agent, entry.agentId),
      agentName: entry.agentName,
      versionId: this.ids.toPublic(IdPrefix.AgentVersion, entry.versionId),
      versionKind:
        entry.versionKind === AgentVersionKind.Draft
          ? PromptUsageVersionKind.Draft
          : PromptUsageVersionKind.Live,
      versionNumber: entry.versionNumber,
      nodeId: reference.nodeId,
      nodeKey: reference.nodeKey,
      nodeLabel: reference.nodeLabel === '' ? reference.nodeKey : reference.nodeLabel,
      pin: reference.pin,
    };
  }
}
