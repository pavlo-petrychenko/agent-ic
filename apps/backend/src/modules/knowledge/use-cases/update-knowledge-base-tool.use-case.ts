import { IdPrefix, PermissionAction, PermissionResource } from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import { KnowledgeBaseNotFoundError } from '@/modules/knowledge/errors/knowledge-base-not-found.error';
import { KnowledgeToolNameTakenError } from '@/modules/knowledge/errors/knowledge-tool-name-taken.error';
import { parseKnowledgeInput } from '@/modules/knowledge/helpers/knowledge-input.helpers';
import { KnowledgeBasesRepository } from '@/modules/knowledge/repositories/knowledge-bases.repository';
import { updateKnowledgeBaseToolInputSchema } from '@/modules/knowledge/schemas/knowledge-input.schema';
import { KnowledgeBaseViewsService } from '@/modules/knowledge/services/knowledge-base-views.service';
import type {
  KnowledgeBaseView,
  UpdateKnowledgeBaseToolInput,
} from '@/modules/knowledge/typedefs/knowledge-base.typedefs';
import { authorize } from '@/platform/context/helpers/authorize.helpers';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { IdService } from '@/platform/ids/services/id.service';

@Injectable()
export class UpdateKnowledgeBaseToolUseCase {
  constructor(
    private readonly tenantTransactions: TenantTransactionService,
    private readonly knowledgeBases: KnowledgeBasesRepository,
    private readonly views: KnowledgeBaseViewsService,
    private readonly ids: IdService,
  ) {}

  async execute(ctx: UseCaseCtx, input: UpdateKnowledgeBaseToolInput): Promise<KnowledgeBaseView> {
    const { workspaceId } = authorize(
      ctx,
      PermissionResource.KnowledgeBases,
      PermissionAction.Edit,
    );
    const parsed = parseKnowledgeInput(updateKnowledgeBaseToolInputSchema, input);
    const knowledgeBaseId = this.ids.fromPublic(IdPrefix.KnowledgeBase, parsed.id);

    return this.tenantTransactions.run(workspaceId, async () => {
      await this.knowledgeBases.lockNames(workspaceId);
      if ((await this.knowledgeBases.findByIdForUpdate(workspaceId, knowledgeBaseId)) === null) {
        throw new KnowledgeBaseNotFoundError();
      }
      const existing = await this.knowledgeBases.findByToolName(workspaceId, parsed.toolName);
      if (existing !== null && existing.id !== knowledgeBaseId) {
        throw new KnowledgeToolNameTakenError();
      }
      const updated = await this.knowledgeBases.update(workspaceId, knowledgeBaseId, {
        toolName: parsed.toolName,
        toolDescription: parsed.toolDescription,
      });
      if (updated === null) {
        throw new KnowledgeBaseNotFoundError();
      }
      return this.views.view(updated);
    });
  }
}
