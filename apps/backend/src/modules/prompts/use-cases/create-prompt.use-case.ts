import { IdPrefix, PermissionAction, PermissionResource } from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import { PromptFolderNotFoundError } from '@/modules/prompts/errors/prompt-folder-not-found.error';
import { PromptNameTakenError } from '@/modules/prompts/errors/prompt-name-taken.error';
import { parsePromptInput } from '@/modules/prompts/helpers/prompt-input.helpers';
import { PromptFoldersRepository } from '@/modules/prompts/repositories/prompt-folders.repository';
import { PromptsRepository } from '@/modules/prompts/repositories/prompts.repository';
import { createPromptInputSchema } from '@/modules/prompts/schemas/prompt-input.schema';
import { PromptViewsService } from '@/modules/prompts/services/prompt-views.service';
import type {
  CreatePromptInput,
  Prompt,
  PromptView,
} from '@/modules/prompts/typedefs/prompt.typedefs';
import { ClockService } from '@/platform/clock/services/clock.service';
import { authorize } from '@/platform/context/helpers/authorize.helpers';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { IdService } from '@/platform/ids/services/id.service';

@Injectable()
export class CreatePromptUseCase {
  constructor(
    private readonly tenantTransactions: TenantTransactionService,
    private readonly prompts: PromptsRepository,
    private readonly folders: PromptFoldersRepository,
    private readonly views: PromptViewsService,
    private readonly clock: ClockService,
    private readonly ids: IdService,
  ) {}

  async execute(ctx: UseCaseCtx, input: CreatePromptInput): Promise<PromptView> {
    const { userId, workspaceId } = authorize(
      ctx,
      PermissionResource.Prompts,
      PermissionAction.Edit,
    );
    const { name, folderId: publicFolderId } = parsePromptInput(createPromptInputSchema, input);
    const folderId = this.ids.fromPublic(IdPrefix.PromptFolder, publicFolderId);
    const now = this.clock.now();
    const prompt: Prompt = {
      id: this.ids.generate(),
      workspaceId,
      name,
      folderId,
      createdByUserId: userId,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };
    return this.tenantTransactions.run(workspaceId, async () => {
      await this.prompts.lockNames(workspaceId);
      if ((await this.folders.findByIdForUpdate(workspaceId, folderId)) === null) {
        throw new PromptFolderNotFoundError();
      }
      if ((await this.prompts.findByName(workspaceId, name)) !== null) {
        throw new PromptNameTakenError();
      }
      await this.prompts.insert(prompt);
      return this.views.promptView(prompt);
    });
  }
}
