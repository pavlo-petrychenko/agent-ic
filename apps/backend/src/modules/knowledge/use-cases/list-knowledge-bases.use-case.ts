import { PermissionAction, PermissionResource } from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import { KnowledgeBasesRepository } from '@/modules/knowledge/repositories/knowledge-bases.repository';
import { KnowledgeBaseViewsService } from '@/modules/knowledge/services/knowledge-base-views.service';
import type { KnowledgeBaseView } from '@/modules/knowledge/typedefs/knowledge-base.typedefs';
import { authorize } from '@/platform/context/helpers/authorize.helpers';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';

@Injectable()
export class ListKnowledgeBasesUseCase {
  constructor(
    private readonly tenantTransactions: TenantTransactionService,
    private readonly knowledgeBases: KnowledgeBasesRepository,
    private readonly views: KnowledgeBaseViewsService,
  ) {}

  async execute(ctx: UseCaseCtx): Promise<KnowledgeBaseView[]> {
    const { workspaceId } = authorize(
      ctx,
      PermissionResource.KnowledgeBases,
      PermissionAction.View,
    );
    return this.tenantTransactions.run(workspaceId, async () =>
      this.views.views(await this.knowledgeBases.list(workspaceId)),
    );
  }
}
