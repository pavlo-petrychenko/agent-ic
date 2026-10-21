import { PermissionAction, PermissionResource } from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import { LlmKeysRepository } from '@/modules/llm-keys/repositories/llm-keys.repository';
import { LlmKeyUsageService } from '@/modules/llm-keys/services/llm-key-usage.service';
import { LlmKeyViewsService } from '@/modules/llm-keys/services/llm-key-views.service';
import type { LlmKeyView } from '@/modules/llm-keys/typedefs/llm-key.typedefs';
import { authorize } from '@/platform/context/helpers/authorize.helpers';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';

@Injectable()
export class ListLlmKeysUseCase {
  constructor(
    private readonly tenantTransactions: TenantTransactionService,
    private readonly keys: LlmKeysRepository,
    private readonly usage: LlmKeyUsageService,
    private readonly views: LlmKeyViewsService,
  ) {}

  async execute(ctx: UseCaseCtx): Promise<LlmKeyView[]> {
    const { workspaceId } = authorize(
      ctx,
      PermissionResource.WorkspaceSettings,
      PermissionAction.View,
    );
    return this.tenantTransactions.run(workspaceId, async () =>
      this.views.keyViews(
        await this.keys.listByWorkspace(workspaceId),
        await this.usage.stepCounts(workspaceId),
      ),
    );
  }
}
