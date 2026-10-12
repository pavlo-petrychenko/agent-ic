import { IdPrefix, PermissionAction, PermissionResource } from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import { PromptFolderNameTakenError } from '@/modules/prompts/errors/prompt-folder-name-taken.error';
import { PromptFolderNotFoundError } from '@/modules/prompts/errors/prompt-folder-not-found.error';
import { parsePromptFolderInput } from '@/modules/prompts/helpers/prompt-folder-input.helpers';
import { PromptFoldersRepository } from '@/modules/prompts/repositories/prompt-folders.repository';
import { renamePromptFolderInputSchema } from '@/modules/prompts/schemas/prompt-folder-input.schema';
import { PromptFolderViewsService } from '@/modules/prompts/services/prompt-folder-views.service';
import type {
  PromptFolderView,
  RenamePromptFolderInput,
} from '@/modules/prompts/typedefs/prompt-folder.typedefs';
import { ClockService } from '@/platform/clock/services/clock.service';
import { authorize } from '@/platform/context/helpers/authorize.helpers';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { IdService } from '@/platform/ids/services/id.service';

@Injectable()
export class RenamePromptFolderUseCase {
  constructor(
    private readonly tenantTransactions: TenantTransactionService,
    private readonly folders: PromptFoldersRepository,
    private readonly views: PromptFolderViewsService,
    private readonly clock: ClockService,
    private readonly ids: IdService,
  ) {}

  async execute(ctx: UseCaseCtx, input: RenamePromptFolderInput): Promise<PromptFolderView> {
    const { workspaceId } = authorize(ctx, PermissionResource.Prompts, PermissionAction.Edit);
    const { id, name } = parsePromptFolderInput(renamePromptFolderInputSchema, input);
    const folderId = this.ids.fromPublic(IdPrefix.PromptFolder, id);
    const updatedAt = this.clock.now();
    return this.tenantTransactions.run(workspaceId, async () => {
      await this.folders.lockNames(workspaceId);
      const folder = await this.folders.findByIdForUpdate(workspaceId, folderId);
      if (folder === null) {
        throw new PromptFolderNotFoundError();
      }
      const taken = await this.folders.findByName(workspaceId, name);
      if (taken !== null && taken.id !== folderId) {
        throw new PromptFolderNameTakenError();
      }
      await this.folders.rename(workspaceId, folderId, name, updatedAt);
      return this.views.folderView({ ...folder, name, updatedAt });
    });
  }
}
