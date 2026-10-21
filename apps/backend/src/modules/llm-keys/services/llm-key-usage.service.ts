import { IdPrefix } from '@agent-ic/contracts';
import { ModelProviderKind, modelReferences } from '@agent-ic/flow';
import { Injectable } from '@nestjs/common';
import { AgentVersionsRepository } from '@/modules/agents';
import { IdService } from '@/platform/ids/services/id.service';

@Injectable()
export class LlmKeyUsageService {
  constructor(
    private readonly flows: AgentVersionsRepository,
    private readonly ids: IdService,
  ) {}

  async stepCounts(workspaceId: string): Promise<ReadonlyMap<string, number>> {
    const counts = new Map<string, number>();
    for (const entry of await this.flows.listCurrentFlows(workspaceId)) {
      for (const { provider } of modelReferences(entry.flow)) {
        const keyId =
          provider.kind === ModelProviderKind.Workspace
            ? this.ids.tryFromPublic(IdPrefix.LlmKey, provider.providerKeyId)
            : null;
        if (keyId !== null) {
          counts.set(keyId, (counts.get(keyId) ?? 0) + 1);
        }
      }
    }
    return counts;
  }

  async countSteps(workspaceId: string, keyId: string): Promise<number> {
    return (await this.stepCounts(workspaceId)).get(keyId) ?? 0;
  }
}
