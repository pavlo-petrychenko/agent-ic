import { IdPrefix, PermissionAction, PermissionResource } from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import { PromptNotFoundError } from '@/modules/prompts/errors/prompt-not-found.error';
import { parsePromptInput } from '@/modules/prompts/helpers/prompt-input.helpers';
import { PromptVersionsRepository } from '@/modules/prompts/repositories/prompt-versions.repository';
import { PromptsRepository } from '@/modules/prompts/repositories/prompts.repository';
import { promptIdInputSchema } from '@/modules/prompts/schemas/prompt-input.schema';
import { PromptViewsService } from '@/modules/prompts/services/prompt-views.service';
import type { PromptDetailView, PromptIdInput } from '@/modules/prompts/typedefs/prompt.typedefs';
import { authorize } from '@/platform/context/helpers/authorize.helpers';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { IdService } from '@/platform/ids/services/id.service';

@Injectable()
export class GetPromptUseCase {
  constructor(
    private readonly tenantTransactions: TenantTransactionService,
    private readonly prompts: PromptsRepository,
    private readonly versions: PromptVersionsRepository,
    private readonly views: PromptViewsService,
    private readonly ids: IdService,
  ) {}

  async execute(ctx: UseCaseCtx, input: PromptIdInput): Promise<PromptDetailView> {
    const { workspaceId } = authorize(ctx, PermissionResource.Prompts, PermissionAction.View);
    const { id } = parsePromptInput(promptIdInputSchema, input);
    const promptId = this.ids.fromPublic(IdPrefix.Prompt, id);
    return this.tenantTransactions.run(workspaceId, async () => {
      const prompt = await this.prompts.findById(workspaceId, promptId);
      if (prompt === null) {
        throw new PromptNotFoundError();
      }
      const latestVersion = await this.versions.findLatest(workspaceId, promptId);
      return this.views.promptDetailView(prompt, latestVersion);
    });
  }
}
