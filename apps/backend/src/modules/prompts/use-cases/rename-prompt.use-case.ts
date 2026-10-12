import { IdPrefix, PermissionAction, PermissionResource } from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import { PromptNameTakenError } from '@/modules/prompts/errors/prompt-name-taken.error';
import { PromptNotFoundError } from '@/modules/prompts/errors/prompt-not-found.error';
import { parsePromptInput } from '@/modules/prompts/helpers/prompt-input.helpers';
import { PromptsRepository } from '@/modules/prompts/repositories/prompts.repository';
import { renamePromptInputSchema } from '@/modules/prompts/schemas/prompt-input.schema';
import { PromptViewsService } from '@/modules/prompts/services/prompt-views.service';
import type { PromptView, RenamePromptInput } from '@/modules/prompts/typedefs/prompt.typedefs';
import { ClockService } from '@/platform/clock/services/clock.service';
import { authorize } from '@/platform/context/helpers/authorize.helpers';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { IdService } from '@/platform/ids/services/id.service';

@Injectable()
export class RenamePromptUseCase {
  constructor(
    private readonly tenantTransactions: TenantTransactionService,
    private readonly prompts: PromptsRepository,
    private readonly views: PromptViewsService,
    private readonly clock: ClockService,
    private readonly ids: IdService,
  ) {}

  async execute(ctx: UseCaseCtx, input: RenamePromptInput): Promise<PromptView> {
    const { workspaceId } = authorize(ctx, PermissionResource.Prompts, PermissionAction.Edit);
    const { id, name } = parsePromptInput(renamePromptInputSchema, input);
    const promptId = this.ids.fromPublic(IdPrefix.Prompt, id);
    const updatedAt = this.clock.now();
    return this.tenantTransactions.run(workspaceId, async () => {
      await this.prompts.lockNames(workspaceId);
      const prompt = await this.prompts.findByIdForUpdate(workspaceId, promptId);
      if (prompt === null) {
        throw new PromptNotFoundError();
      }
      const taken = await this.prompts.findByName(workspaceId, name);
      if (taken !== null && taken.id !== promptId) {
        throw new PromptNameTakenError();
      }
      await this.prompts.rename(workspaceId, promptId, name, updatedAt);
      return this.views.promptView({ ...prompt, name, updatedAt });
    });
  }
}
