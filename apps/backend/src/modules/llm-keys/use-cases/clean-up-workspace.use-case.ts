import { Injectable } from '@nestjs/common';
import type { WorkspaceDeletedInput } from '@/modules/identity';
import { LlmKeysRepository } from '@/modules/llm-keys/repositories/llm-keys.repository';
import { requireSystemActor } from '@/platform/context/helpers/use-case-ctx.helpers';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';

@Injectable()
export class CleanUpWorkspaceUseCase {
  constructor(
    private readonly tenantTransactions: TenantTransactionService,
    private readonly keys: LlmKeysRepository,
  ) {}

  async execute(ctx: UseCaseCtx, input: WorkspaceDeletedInput): Promise<void> {
    requireSystemActor(ctx);
    await this.tenantTransactions.run(input.workspaceId, () =>
      this.keys.deleteByWorkspace(input.workspaceId),
    );
  }
}
