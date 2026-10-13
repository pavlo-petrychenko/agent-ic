import { IdPrefix, PermissionAction, PermissionResource } from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import {
  FIRST_PROMPT_NAME_NUMBER,
  FIRST_PROMPT_VERSION_NUMBER,
} from '@/modules/prompts/constants/prompt.constants';
import { PromptFolderNotFoundError } from '@/modules/prompts/errors/prompt-folder-not-found.error';
import { PromptNotFoundError } from '@/modules/prompts/errors/prompt-not-found.error';
import { parsePromptInput } from '@/modules/prompts/helpers/prompt-input.helpers';
import {
  duplicatePromptName,
  numberedPromptName,
} from '@/modules/prompts/helpers/prompt-name.helpers';
import { PromptFoldersRepository } from '@/modules/prompts/repositories/prompt-folders.repository';
import { PromptVersionsRepository } from '@/modules/prompts/repositories/prompt-versions.repository';
import { PromptsRepository } from '@/modules/prompts/repositories/prompts.repository';
import { duplicatePromptInputSchema } from '@/modules/prompts/schemas/prompt-input.schema';
import { PromptViewsService } from '@/modules/prompts/services/prompt-views.service';
import type {
  DuplicatePromptInput,
  Prompt,
  PromptView,
} from '@/modules/prompts/typedefs/prompt.typedefs';
import { ClockService } from '@/platform/clock/services/clock.service';
import { authorize } from '@/platform/context/helpers/authorize.helpers';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { IdService } from '@/platform/ids/services/id.service';

@Injectable()
export class DuplicatePromptUseCase {
  constructor(
    private readonly tenantTransactions: TenantTransactionService,
    private readonly prompts: PromptsRepository,
    private readonly folders: PromptFoldersRepository,
    private readonly versions: PromptVersionsRepository,
    private readonly views: PromptViewsService,
    private readonly clock: ClockService,
    private readonly ids: IdService,
  ) {}

  async execute(ctx: UseCaseCtx, input: DuplicatePromptInput): Promise<PromptView> {
    const { userId, workspaceId } = authorize(
      ctx,
      PermissionResource.Prompts,
      PermissionAction.Edit,
    );
    const { id, folderId: publicFolderId } = parsePromptInput(duplicatePromptInputSchema, input);
    const sourceId = this.ids.fromPublic(IdPrefix.Prompt, id);
    const targetFolderId = this.ids.fromPublic(IdPrefix.PromptFolder, publicFolderId);
    const now = this.clock.now();
    return this.tenantTransactions.run(workspaceId, async () => {
      await this.prompts.lockNames(workspaceId);
      const source = await this.prompts.findById(workspaceId, sourceId);
      if (source === null) {
        throw new PromptNotFoundError();
      }
      if ((await this.folders.findByIdForUpdate(workspaceId, targetFolderId)) === null) {
        throw new PromptFolderNotFoundError();
      }
      const copy: Prompt = {
        id: this.ids.generate(),
        workspaceId,
        name: await this.availableCopyName(workspaceId, source.name),
        folderId: targetFolderId,
        createdByUserId: userId,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      };
      await this.prompts.insert(copy);
      const latest = (await this.versions.listByPrompt(workspaceId, sourceId))[0];
      if (latest !== undefined) {
        await this.versions.insert({
          id: this.ids.generate(),
          workspaceId,
          promptId: copy.id,
          number: FIRST_PROMPT_VERSION_NUMBER,
          text: latest.text,
          note: latest.note,
          authorId: userId,
          createdAt: now,
        });
      }
      return this.views.promptView(copy);
    });
  }

  private async availableCopyName(workspaceId: string, sourceName: string): Promise<string> {
    const copyName = duplicatePromptName(sourceName);
    let name = copyName;
    let number = FIRST_PROMPT_NAME_NUMBER;
    while ((await this.prompts.findByName(workspaceId, name)) !== null) {
      name = numberedPromptName(copyName, number);
      number += 1;
    }
    return name;
  }
}
