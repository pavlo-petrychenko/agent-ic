import { PermissionAction, PermissionResource } from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import { LlmKeysRepository } from '@/modules/llm-keys/repositories/llm-keys.repository';
import { LlmKeyViewsService } from '@/modules/llm-keys/services/llm-key-views.service';
import type { LlmKeyOption } from '@/modules/llm-keys/typedefs/llm-key.typedefs';
import { authorize } from '@/platform/context/helpers/authorize.helpers';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';

@Injectable()
export class ListLlmKeyOptionsUseCase {
  constructor(
    private readonly tenantTransactions: TenantTransactionService,
    private readonly keys: LlmKeysRepository,
    private readonly views: LlmKeyViewsService,
  ) {}

  async execute(ctx: UseCaseCtx): Promise<LlmKeyOption[]> {
    const { workspaceId } = authorize(ctx, PermissionResource.Agents, PermissionAction.View);
    return this.tenantTransactions.run(workspaceId, async () =>
      this.views.keyOptions(await this.keys.listByWorkspace(workspaceId)),
    );
  }
}
