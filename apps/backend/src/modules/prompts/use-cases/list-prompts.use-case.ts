import { IdPrefix, PermissionAction, PermissionResource } from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import { PromptsRepository } from '@/modules/prompts/repositories/prompts.repository';
import { PromptViewsService } from '@/modules/prompts/services/prompt-views.service';
import type { ListPromptsInput, PromptView } from '@/modules/prompts/typedefs/prompt.typedefs';
import { authorize } from '@/platform/context/helpers/authorize.helpers';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { IdService } from '@/platform/ids/services/id.service';

@Injectable()
export class ListPromptsUseCase {
  constructor(
    private readonly tenantTransactions: TenantTransactionService,
    private readonly prompts: PromptsRepository,
    private readonly views: PromptViewsService,
    private readonly ids: IdService,
  ) {}

  async execute(ctx: UseCaseCtx, input: ListPromptsInput): Promise<PromptView[]> {
    const { workspaceId } = authorize(ctx, PermissionResource.Prompts, PermissionAction.View);
    const publicFolderId = input.folderId ?? null;
    const folderId =
      publicFolderId === null ? null : this.ids.fromPublic(IdPrefix.PromptFolder, publicFolderId);
    const search = (input.search ?? '').trim();
    return this.tenantTransactions.run(workspaceId, async () => {
      const rows = await this.prompts.list(workspaceId, {
        folderId,
        search: search.length === 0 ? null : search,
      });
      return this.views.promptViews(rows);
    });
  }
}
