import { PermissionAction, PermissionResource } from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import { PromptFolderNameTakenError } from '@/modules/prompts/errors/prompt-folder-name-taken.error';
import { parsePromptFolderInput } from '@/modules/prompts/helpers/prompt-folder-input.helpers';
import { PromptFoldersRepository } from '@/modules/prompts/repositories/prompt-folders.repository';
import { createPromptFolderInputSchema } from '@/modules/prompts/schemas/prompt-folder-input.schema';
import { PromptFolderViewsService } from '@/modules/prompts/services/prompt-folder-views.service';
import type {
  CreatePromptFolderInput,
  PromptFolder,
  PromptFolderView,
} from '@/modules/prompts/typedefs/prompt-folder.typedefs';
import { ClockService } from '@/platform/clock/services/clock.service';
import { authorize } from '@/platform/context/helpers/authorize.helpers';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { IdService } from '@/platform/ids/services/id.service';

@Injectable()
export class CreatePromptFolderUseCase {
  constructor(
    private readonly tenantTransactions: TenantTransactionService,
    private readonly folders: PromptFoldersRepository,
    private readonly views: PromptFolderViewsService,
    private readonly clock: ClockService,
    private readonly ids: IdService,
  ) {}

  async execute(ctx: UseCaseCtx, input: CreatePromptFolderInput): Promise<PromptFolderView> {
    const { workspaceId } = authorize(ctx, PermissionResource.Prompts, PermissionAction.Edit);
    const { name } = parsePromptFolderInput(createPromptFolderInputSchema, input);
    const now = this.clock.now();
    const folder: PromptFolder = {
      id: this.ids.generate(),
      workspaceId,
      name,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };
    return this.tenantTransactions.run(workspaceId, async () => {
      await this.folders.lockNames(workspaceId);
      if ((await this.folders.findByName(workspaceId, name)) !== null) {
        throw new PromptFolderNameTakenError();
      }
      await this.folders.insert(folder);
      return this.views.folderView(folder);
    });
  }
}
