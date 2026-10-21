import { IdPrefix, PermissionAction, PermissionResource } from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import { PromptInUseError } from '@/modules/prompts/errors/prompt-in-use.error';
import { PromptNotFoundError } from '@/modules/prompts/errors/prompt-not-found.error';
import { parsePromptInput } from '@/modules/prompts/helpers/prompt-input.helpers';
import { PromptVersionsRepository } from '@/modules/prompts/repositories/prompt-versions.repository';
import { PromptsRepository } from '@/modules/prompts/repositories/prompts.repository';
import { promptIdInputSchema } from '@/modules/prompts/schemas/prompt-input.schema';
import { PromptUsageService } from '@/modules/prompts/services/prompt-usage.service';
import type { PromptIdInput } from '@/modules/prompts/typedefs/prompt.typedefs';
import { ClockService } from '@/platform/clock/services/clock.service';
import { authorize } from '@/platform/context/helpers/authorize.helpers';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { IdService } from '@/platform/ids/services/id.service';

@Injectable()
export class DeletePromptUseCase {
  constructor(
    private readonly tenantTransactions: TenantTransactionService,
    private readonly prompts: PromptsRepository,
    private readonly versions: PromptVersionsRepository,
    private readonly usages: PromptUsageService,
    private readonly clock: ClockService,
    private readonly ids: IdService,
  ) {}

  async execute(ctx: UseCaseCtx, input: PromptIdInput): Promise<PromptIdInput> {
    const { workspaceId } = authorize(ctx, PermissionResource.Prompts, PermissionAction.Delete);
    const { id } = parsePromptInput(promptIdInputSchema, input);
    const promptId = this.ids.fromPublic(IdPrefix.Prompt, id);
    const deletedAt = this.clock.now();
    await this.tenantTransactions.run(workspaceId, async () => {
      const prompt = await this.prompts.findByIdForUpdate(workspaceId, promptId);
      if (prompt === null) {
        throw new PromptNotFoundError();
      }
      const usages = await this.usages.listForPrompt(workspaceId, promptId);
      if (usages.length > 0) {
        throw new PromptInUseError(usages.length);
      }
      await this.versions.softDeleteByPrompt(workspaceId, promptId, deletedAt);
      await this.prompts.softDelete(workspaceId, promptId, deletedAt);
    });
    return { id };
  }
}
