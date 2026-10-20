import { Injectable } from '@nestjs/common';
import type { WorkspaceDeletedInput } from '@/modules/identity';
import { PromptFoldersRepository } from '@/modules/prompts/repositories/prompt-folders.repository';
import { PromptVersionsRepository } from '@/modules/prompts/repositories/prompt-versions.repository';
import { PromptsRepository } from '@/modules/prompts/repositories/prompts.repository';
import { requireSystemActor } from '@/platform/context/helpers/use-case-ctx.helpers';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';

@Injectable()
export class CleanUpWorkspaceUseCase {
  constructor(
    private readonly tenantTransactions: TenantTransactionService,
    private readonly versions: PromptVersionsRepository,
    private readonly prompts: PromptsRepository,
    private readonly folders: PromptFoldersRepository,
  ) {}

  async execute(ctx: UseCaseCtx, input: WorkspaceDeletedInput): Promise<void> {
    requireSystemActor(ctx);
    await this.tenantTransactions.run(input.workspaceId, async () => {
      await this.versions.deleteByWorkspace(input.workspaceId);
      await this.prompts.deleteByWorkspace(input.workspaceId);
      await this.folders.deleteByWorkspace(input.workspaceId);
    });
  }
}
