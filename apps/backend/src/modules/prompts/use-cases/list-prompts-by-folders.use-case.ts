import { IdPrefix, PermissionAction, PermissionResource } from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import { PromptsRepository } from '@/modules/prompts/repositories/prompts.repository';
import { PromptViewsService } from '@/modules/prompts/services/prompt-views.service';
import type { PromptView } from '@/modules/prompts/typedefs/prompt.typedefs';
import { authorize } from '@/platform/context/helpers/authorize.helpers';
import { groupByKey } from '@/platform/context/helpers/batch.helpers';
import type { BatchUseCase } from '@/platform/context/typedefs/batch-use-case.typedefs';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { IdService } from '@/platform/ids/services/id.service';

@Injectable()
export class ListPromptsByFoldersUseCase implements BatchUseCase<string, readonly PromptView[]> {
  constructor(
    private readonly tenantTransactions: TenantTransactionService,
    private readonly prompts: PromptsRepository,
    private readonly views: PromptViewsService,
    private readonly ids: IdService,
  ) {}

  async execute(
    ctx: UseCaseCtx,
    keys: readonly string[],
  ): Promise<ReadonlyMap<string, readonly PromptView[]>> {
    const { workspaceId } = authorize(ctx, PermissionResource.Prompts, PermissionAction.View);
    const folderIds = keys.map((key) => this.ids.fromPublic(IdPrefix.PromptFolder, key));
    return this.tenantTransactions.run(workspaceId, async () => {
      const rows = await this.prompts.listByFolderIds(workspaceId, folderIds);
      return groupByKey(keys, this.views.promptViews(rows), ({ folderId }) => folderId);
    });
  }
}
