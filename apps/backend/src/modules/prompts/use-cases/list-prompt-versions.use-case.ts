import { IdPrefix, PermissionAction, PermissionResource } from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import { PromptNotFoundError } from '@/modules/prompts/errors/prompt-not-found.error';
import { parsePromptInput } from '@/modules/prompts/helpers/prompt-input.helpers';
import { PromptVersionsRepository } from '@/modules/prompts/repositories/prompt-versions.repository';
import { PromptsRepository } from '@/modules/prompts/repositories/prompts.repository';
import { listPromptVersionsInputSchema } from '@/modules/prompts/schemas/prompt-input.schema';
import { PromptViewsService } from '@/modules/prompts/services/prompt-views.service';
import type {
  ListPromptVersionsInput,
  PromptVersionView,
} from '@/modules/prompts/typedefs/prompt-version.typedefs';
import { authorize } from '@/platform/context/helpers/authorize.helpers';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { IdService } from '@/platform/ids/services/id.service';

@Injectable()
export class ListPromptVersionsUseCase {
  constructor(
    private readonly tenantTransactions: TenantTransactionService,
    private readonly prompts: PromptsRepository,
    private readonly versions: PromptVersionsRepository,
    private readonly views: PromptViewsService,
    private readonly ids: IdService,
  ) {}

  async execute(ctx: UseCaseCtx, input: ListPromptVersionsInput): Promise<PromptVersionView[]> {
    const { workspaceId } = authorize(ctx, PermissionResource.Prompts, PermissionAction.View);
    const { promptId: publicPromptId } = parsePromptInput(listPromptVersionsInputSchema, input);
    const promptId = this.ids.fromPublic(IdPrefix.Prompt, publicPromptId);
    return this.tenantTransactions.run(workspaceId, async () => {
      const prompt = await this.prompts.findById(workspaceId, promptId);
      if (prompt === null) {
        throw new PromptNotFoundError();
      }
      return this.views.promptVersionViews(await this.versions.listByPrompt(workspaceId, promptId));
    });
  }
}
