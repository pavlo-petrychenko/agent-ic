import { IdPrefix, PermissionAction, PermissionResource } from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import { PromptNotFoundError } from '@/modules/prompts/errors/prompt-not-found.error';
import { parsePromptInput } from '@/modules/prompts/helpers/prompt-input.helpers';
import { PromptsRepository } from '@/modules/prompts/repositories/prompts.repository';
import { promptIdInputSchema } from '@/modules/prompts/schemas/prompt-input.schema';
import { PromptUsageService } from '@/modules/prompts/services/prompt-usage.service';
import type { PromptUsage } from '@/modules/prompts/typedefs/prompt-usage.typedefs';
import type { PromptIdInput } from '@/modules/prompts/typedefs/prompt.typedefs';
import { authorize } from '@/platform/context/helpers/authorize.helpers';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { IdService } from '@/platform/ids/services/id.service';

@Injectable()
export class ListPromptUsagesUseCase {
  constructor(
    private readonly tenantTransactions: TenantTransactionService,
    private readonly prompts: PromptsRepository,
    private readonly usages: PromptUsageService,
    private readonly ids: IdService,
  ) {}

  async execute(ctx: UseCaseCtx, input: PromptIdInput): Promise<readonly PromptUsage[]> {
    const { workspaceId } = authorize(ctx, PermissionResource.Prompts, PermissionAction.View);
    const { id } = parsePromptInput(promptIdInputSchema, input);
    const promptId = this.ids.fromPublic(IdPrefix.Prompt, id);
    return this.tenantTransactions.run(workspaceId, async () => {
      if ((await this.prompts.findById(workspaceId, promptId)) === null) {
        throw new PromptNotFoundError();
      }
      return this.usages.listForPrompt(workspaceId, promptId);
    });
  }
}
