import { IdPrefix, PermissionAction, PermissionResource } from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import { KnowledgeSourceNotFoundError } from '@/modules/knowledge/errors/knowledge-source-not-found.error';
import { parseKnowledgeInput } from '@/modules/knowledge/helpers/knowledge-input.helpers';
import { SourcesRepository } from '@/modules/knowledge/repositories/sources.repository';
import { renameKnowledgeSourceInputSchema } from '@/modules/knowledge/schemas/knowledge-input.schema';
import { KnowledgeSourceViewsService } from '@/modules/knowledge/services/knowledge-source-views.service';
import type {
  KnowledgeSourceView,
  RenameKnowledgeSourceInput,
} from '@/modules/knowledge/typedefs/source.typedefs';
import { authorize } from '@/platform/context/helpers/authorize.helpers';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { IdService } from '@/platform/ids/services/id.service';

@Injectable()
export class RenameKnowledgeSourceUseCase {
  constructor(
    private readonly tenantTransactions: TenantTransactionService,
    private readonly sources: SourcesRepository,
    private readonly views: KnowledgeSourceViewsService,
    private readonly ids: IdService,
  ) {}

  async execute(ctx: UseCaseCtx, input: RenameKnowledgeSourceInput): Promise<KnowledgeSourceView> {
    const { workspaceId } = authorize(
      ctx,
      PermissionResource.KnowledgeBases,
      PermissionAction.Edit,
    );
    const parsed = parseKnowledgeInput(renameKnowledgeSourceInputSchema, input);
    const sourceId = this.ids.fromPublic(IdPrefix.KnowledgeSource, parsed.id);

    return this.tenantTransactions.run(workspaceId, async () => {
      const updated = await this.sources.update(workspaceId, sourceId, { title: parsed.title });
      if (updated === null) {
        throw new KnowledgeSourceNotFoundError();
      }
      return this.views.view(updated);
    });
  }
}
