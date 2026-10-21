import { IdPrefix, PermissionAction, PermissionResource } from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import { llmKeyModelsEntry } from '@/modules/llm-keys/constants/llm-key-cache.constants';
import { LlmKeyResolverService } from '@/modules/llm-keys/services/llm-key-resolver.service';
import type { LlmKeyIdInput } from '@/modules/llm-keys/typedefs/llm-key.typedefs';
import { CacheService } from '@/platform/cache/services/cache.service';
import { authorize } from '@/platform/context/helpers/authorize.helpers';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { IdService } from '@/platform/ids/services/id.service';
import { LlmModelListGateway } from '@/platform/llm/gateways/llm-model-list.gateway';

@Injectable()
export class ListLlmKeyModelsUseCase {
  constructor(
    private readonly resolver: LlmKeyResolverService,
    private readonly models: LlmModelListGateway,
    private readonly cache: CacheService,
    private readonly ids: IdService,
  ) {}

  async execute(ctx: UseCaseCtx, input: LlmKeyIdInput): Promise<readonly string[]> {
    const { workspaceId } = authorize(ctx, PermissionResource.Agents, PermissionAction.View);
    const keyId = this.ids.fromPublic(IdPrefix.LlmKey, input.id);
    const key = await this.resolver.resolve(workspaceId, keyId);
    return this.cache.getOrLoad(llmKeyModelsEntry(workspaceId, keyId), () => this.models.list(key));
  }
}
