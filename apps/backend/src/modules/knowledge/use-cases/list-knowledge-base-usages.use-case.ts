import { IdPrefix, PermissionAction, PermissionResource } from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import { KnowledgeBaseNotFoundError } from '@/modules/knowledge/errors/knowledge-base-not-found.error';
import { parseKnowledgeInput } from '@/modules/knowledge/helpers/knowledge-input.helpers';
import { KnowledgeBasesRepository } from '@/modules/knowledge/repositories/knowledge-bases.repository';
import { listKnowledgeBaseUsagesInputSchema } from '@/modules/knowledge/schemas/knowledge-input.schema';
import { KnowledgeUsageService } from '@/modules/knowledge/services/knowledge-usage.service';
import type { KnowledgeBaseUsage } from '@/modules/knowledge/typedefs/knowledge-base-usage.typedefs';
import type { ListKnowledgeBaseUsagesInput } from '@/modules/knowledge/typedefs/knowledge-base.typedefs';
import { authorize } from '@/platform/context/helpers/authorize.helpers';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { IdService } from '@/platform/ids/services/id.service';

@Injectable()
export class ListKnowledgeBaseUsagesUseCase {
  constructor(
    private readonly tenantTransactions: TenantTransactionService,
    private readonly knowledgeBases: KnowledgeBasesRepository,
    private readonly usages: KnowledgeUsageService,
    private readonly ids: IdService,
  ) {}

  async execute(
    ctx: UseCaseCtx,
    input: ListKnowledgeBaseUsagesInput,
  ): Promise<readonly KnowledgeBaseUsage[]> {
    const { workspaceId } = authorize(
      ctx,
      PermissionResource.KnowledgeBases,
      PermissionAction.View,
    );
    const parsed = parseKnowledgeInput(listKnowledgeBaseUsagesInputSchema, input);
    const knowledgeBaseId = this.ids.fromPublic(IdPrefix.KnowledgeBase, parsed.knowledgeBaseId);

    return this.tenantTransactions.run(workspaceId, async () => {
      if ((await this.knowledgeBases.findById(workspaceId, knowledgeBaseId)) === null) {
        throw new KnowledgeBaseNotFoundError();
      }
      return this.usages.listForKnowledgeBase(workspaceId, knowledgeBaseId);
    });
  }
}
