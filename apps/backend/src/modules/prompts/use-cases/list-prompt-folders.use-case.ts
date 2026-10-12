import { PermissionAction, PermissionResource } from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import { PromptFoldersRepository } from '@/modules/prompts/repositories/prompt-folders.repository';
import { PromptFolderViewsService } from '@/modules/prompts/services/prompt-folder-views.service';
import type { PromptFolderView } from '@/modules/prompts/typedefs/prompt-folder.typedefs';
import { authorize } from '@/platform/context/helpers/authorize.helpers';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';

@Injectable()
export class ListPromptFoldersUseCase {
  constructor(
    private readonly tenantTransactions: TenantTransactionService,
    private readonly folders: PromptFoldersRepository,
    private readonly views: PromptFolderViewsService,
  ) {}

  async execute(ctx: UseCaseCtx): Promise<PromptFolderView[]> {
    const { workspaceId } = authorize(ctx, PermissionResource.Prompts, PermissionAction.View);
    return this.tenantTransactions.run(workspaceId, async () => {
      const listFolders = await this.folders.listByWorkspace(workspaceId);
      return this.views.folderViews(listFolders);
    });
  }
}
