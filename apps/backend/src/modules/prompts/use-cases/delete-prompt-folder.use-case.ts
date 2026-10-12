import { IdPrefix, PermissionAction, PermissionResource } from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import { PromptFolderNotEmptyError } from '@/modules/prompts/errors/prompt-folder-not-empty.error';
import { PromptFolderNotFoundError } from '@/modules/prompts/errors/prompt-folder-not-found.error';
import { parsePromptFolderInput } from '@/modules/prompts/helpers/prompt-folder-input.helpers';
import { PromptFoldersRepository } from '@/modules/prompts/repositories/prompt-folders.repository';
import { PromptsRepository } from '@/modules/prompts/repositories/prompts.repository';
import { deletePromptFolderInputSchema } from '@/modules/prompts/schemas/prompt-folder-input.schema';
import type { DeletePromptFolderInput } from '@/modules/prompts/typedefs/prompt-folder.typedefs';
import { ClockService } from '@/platform/clock/services/clock.service';
import { authorize } from '@/platform/context/helpers/authorize.helpers';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { IdService } from '@/platform/ids/services/id.service';

@Injectable()
export class DeletePromptFolderUseCase {
  constructor(
    private readonly tenantTransactions: TenantTransactionService,
    private readonly folders: PromptFoldersRepository,
    private readonly prompts: PromptsRepository,
    private readonly clock: ClockService,
    private readonly ids: IdService,
  ) {}

  async execute(ctx: UseCaseCtx, input: DeletePromptFolderInput): Promise<DeletePromptFolderInput> {
    const { workspaceId } = authorize(ctx, PermissionResource.Prompts, PermissionAction.Delete);
    const { id } = parsePromptFolderInput(deletePromptFolderInputSchema, input);
    const folderId = this.ids.fromPublic(IdPrefix.PromptFolder, id);
    await this.tenantTransactions.run(workspaceId, async () => {
      const folder = await this.folders.findByIdForUpdate(workspaceId, folderId);
      if (folder === null) {
        throw new PromptFolderNotFoundError();
      }
      const promptCount = await this.prompts.countByFolder(workspaceId, folderId);
      if (promptCount > 0) {
        throw new PromptFolderNotEmptyError(promptCount);
      }
      await this.folders.softDelete(workspaceId, folderId, this.clock.now());
    });
    return { id };
  }
}
