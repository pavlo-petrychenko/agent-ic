import { IdPrefix, PermissionAction, PermissionResource } from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import { PromptFolderNotFoundError } from '@/modules/prompts/errors/prompt-folder-not-found.error';
import { PromptNotFoundError } from '@/modules/prompts/errors/prompt-not-found.error';
import { parsePromptInput } from '@/modules/prompts/helpers/prompt-input.helpers';
import { PromptFoldersRepository } from '@/modules/prompts/repositories/prompt-folders.repository';
import { PromptsRepository } from '@/modules/prompts/repositories/prompts.repository';
import { movePromptToFolderInputSchema } from '@/modules/prompts/schemas/prompt-input.schema';
import { PromptViewsService } from '@/modules/prompts/services/prompt-views.service';
import type {
  MovePromptToFolderInput,
  PromptView,
} from '@/modules/prompts/typedefs/prompt.typedefs';
import { authorize } from '@/platform/context/helpers/authorize.helpers';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { IdService } from '@/platform/ids/services/id.service';

@Injectable()
export class MovePromptToFolderUseCase {
  constructor(
    private readonly tenantTransactions: TenantTransactionService,
    private readonly prompts: PromptsRepository,
    private readonly folders: PromptFoldersRepository,
    private readonly views: PromptViewsService,
    private readonly ids: IdService,
  ) {}

  async execute(ctx: UseCaseCtx, input: MovePromptToFolderInput): Promise<PromptView> {
    const { workspaceId } = authorize(ctx, PermissionResource.Prompts, PermissionAction.Edit);
    const { id, folderId: publicFolderId } = parsePromptInput(movePromptToFolderInputSchema, input);
    const promptId = this.ids.fromPublic(IdPrefix.Prompt, id);
    const folderId = this.ids.fromPublic(IdPrefix.PromptFolder, publicFolderId);
    return this.tenantTransactions.run(workspaceId, async () => {
      if ((await this.folders.findByIdForUpdate(workspaceId, folderId)) === null) {
        throw new PromptFolderNotFoundError();
      }
      const prompt = await this.prompts.findByIdForUpdate(workspaceId, promptId);
      if (prompt === null) {
        throw new PromptNotFoundError();
      }
      if (prompt.folderId === folderId) {
        return this.views.promptView(prompt);
      }
      const moved = await this.prompts.moveToFolder(workspaceId, promptId, folderId);
      if (moved === null) {
        throw new PromptNotFoundError();
      }
      return this.views.promptView(moved);
    });
  }
}
