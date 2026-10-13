import { IdPrefix, PermissionAction, PermissionResource } from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import { PromptVersionNotFoundError } from '@/modules/prompts/errors/prompt-version-not-found.error';
import { parsePromptInput } from '@/modules/prompts/helpers/prompt-input.helpers';
import { PromptVersionsRepository } from '@/modules/prompts/repositories/prompt-versions.repository';
import { promptVersionIdInputSchema } from '@/modules/prompts/schemas/prompt-input.schema';
import { PromptViewsService } from '@/modules/prompts/services/prompt-views.service';
import type {
  PromptVersionIdInput,
  PromptVersionView,
} from '@/modules/prompts/typedefs/prompt-version.typedefs';
import { authorize } from '@/platform/context/helpers/authorize.helpers';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { IdService } from '@/platform/ids/services/id.service';

@Injectable()
export class GetPromptVersionUseCase {
  constructor(
    private readonly tenantTransactions: TenantTransactionService,
    private readonly versions: PromptVersionsRepository,
    private readonly views: PromptViewsService,
    private readonly ids: IdService,
  ) {}

  async execute(ctx: UseCaseCtx, input: PromptVersionIdInput): Promise<PromptVersionView> {
    const { workspaceId } = authorize(ctx, PermissionResource.Prompts, PermissionAction.View);
    const { id } = parsePromptInput(promptVersionIdInputSchema, input);
    const versionId = this.ids.fromPublic(IdPrefix.PromptVersion, id);
    return this.tenantTransactions.run(workspaceId, async () => {
      const version = await this.versions.findById(workspaceId, versionId);
      if (version === null) {
        throw new PromptVersionNotFoundError();
      }
      return this.views.promptVersionView(version);
    });
  }
}
