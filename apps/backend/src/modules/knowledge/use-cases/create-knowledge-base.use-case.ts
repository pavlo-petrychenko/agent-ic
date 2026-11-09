import { PermissionAction, PermissionResource } from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import { parseKnowledgeInput } from '@/modules/knowledge/helpers/knowledge-input.helpers';
import { createKnowledgeBaseInputSchema } from '@/modules/knowledge/schemas/knowledge-input.schema';
import { KnowledgeBaseCreatorService } from '@/modules/knowledge/services/knowledge-base-creator.service';
import { KnowledgeBaseViewsService } from '@/modules/knowledge/services/knowledge-base-views.service';
import type {
  CreateKnowledgeBaseInput,
  KnowledgeBaseView,
} from '@/modules/knowledge/typedefs/knowledge-base.typedefs';
import { authorize } from '@/platform/context/helpers/authorize.helpers';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';

@Injectable()
export class CreateKnowledgeBaseUseCase {
  constructor(
    private readonly tenantTransactions: TenantTransactionService,
    private readonly creator: KnowledgeBaseCreatorService,
    private readonly views: KnowledgeBaseViewsService,
  ) {}

  async execute(ctx: UseCaseCtx, input: CreateKnowledgeBaseInput): Promise<KnowledgeBaseView> {
    const { userId, workspaceId } = authorize(
      ctx,
      PermissionResource.KnowledgeBases,
      PermissionAction.Edit,
    );
    const parsed = parseKnowledgeInput(createKnowledgeBaseInputSchema, input);

    return this.tenantTransactions.run(workspaceId, async () =>
      this.views.view(
        await this.creator.create({
          workspaceId,
          name: parsed.name,
          description: parsed.description,
          createdByUserId: userId,
        }),
      ),
    );
  }
}
