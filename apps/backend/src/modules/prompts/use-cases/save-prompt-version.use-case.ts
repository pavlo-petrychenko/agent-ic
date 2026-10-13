import { IdPrefix, PermissionAction, PermissionResource } from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import { PromptNotFoundError } from '@/modules/prompts/errors/prompt-not-found.error';
import { parsePromptInput } from '@/modules/prompts/helpers/prompt-input.helpers';
import { PromptVersionsRepository } from '@/modules/prompts/repositories/prompt-versions.repository';
import { PromptsRepository } from '@/modules/prompts/repositories/prompts.repository';
import { savePromptVersionInputSchema } from '@/modules/prompts/schemas/prompt-input.schema';
import { PromptViewsService } from '@/modules/prompts/services/prompt-views.service';
import type {
  PromptVersion,
  SavePromptVersionInput,
} from '@/modules/prompts/typedefs/prompt-version.typedefs';
import type { PromptDetailView } from '@/modules/prompts/typedefs/prompt.typedefs';
import { ClockService } from '@/platform/clock/services/clock.service';
import { authorize } from '@/platform/context/helpers/authorize.helpers';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { IdService } from '@/platform/ids/services/id.service';

@Injectable()
export class SavePromptVersionUseCase {
  constructor(
    private readonly tenantTransactions: TenantTransactionService,
    private readonly prompts: PromptsRepository,
    private readonly versions: PromptVersionsRepository,
    private readonly views: PromptViewsService,
    private readonly clock: ClockService,
    private readonly ids: IdService,
  ) {}

  async execute(ctx: UseCaseCtx, input: SavePromptVersionInput): Promise<PromptDetailView> {
    const { userId, workspaceId } = authorize(
      ctx,
      PermissionResource.Prompts,
      PermissionAction.Edit,
    );
    const { id, text, note } = parsePromptInput(savePromptVersionInputSchema, input);
    const promptId = this.ids.fromPublic(IdPrefix.Prompt, id);
    const createdAt = this.clock.now();
    return this.tenantTransactions.run(workspaceId, async () => {
      const prompt = await this.prompts.findByIdForUpdate(workspaceId, promptId);
      if (prompt === null) {
        throw new PromptNotFoundError();
      }
      const version: PromptVersion = {
        id: this.ids.generate(),
        workspaceId,
        promptId,
        number: (await this.versions.lastNumber(workspaceId, promptId)) + 1,
        text,
        note: note ?? null,
        authorId: userId,
        createdAt,
        deletedAt: null,
      };
      await this.versions.insert(version);
      await this.prompts.touch(workspaceId, promptId, createdAt);
      return this.views.promptDetailView({ ...prompt, updatedAt: createdAt }, version);
    });
  }
}
