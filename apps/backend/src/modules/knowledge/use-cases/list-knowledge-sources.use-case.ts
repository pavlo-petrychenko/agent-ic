import { IdPrefix, PermissionAction, PermissionResource } from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import { KnowledgeBaseNotFoundError } from '@/modules/knowledge/errors/knowledge-base-not-found.error';
import { parseKnowledgeInput } from '@/modules/knowledge/helpers/knowledge-input.helpers';
import { KnowledgeBasesRepository } from '@/modules/knowledge/repositories/knowledge-bases.repository';
import { SourcesRepository } from '@/modules/knowledge/repositories/sources.repository';
import { listKnowledgeSourcesInputSchema } from '@/modules/knowledge/schemas/knowledge-input.schema';
import { KnowledgeSourceViewsService } from '@/modules/knowledge/services/knowledge-source-views.service';
import type {
  KnowledgeSourceView,
  ListKnowledgeSourcesInput,
} from '@/modules/knowledge/typedefs/source.typedefs';
import { authorize } from '@/platform/context/helpers/authorize.helpers';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { IdService } from '@/platform/ids/services/id.service';

@Injectable()
export class ListKnowledgeSourcesUseCase {
  constructor(
    private readonly tenants: TenantTransactionService,
    private readonly knowledgeBases: KnowledgeBasesRepository,
    private readonly sources: SourcesRepository,
    private readonly views: KnowledgeSourceViewsService,
    private readonly ids: IdService,
  ) {}

  async execute(ctx: UseCaseCtx, input: ListKnowledgeSourcesInput): Promise<KnowledgeSourceView[]> {
    const { workspaceId } = authorize(
      ctx,
      PermissionResource.KnowledgeBases,
      PermissionAction.View,
    );
    const parsed = parseKnowledgeInput(listKnowledgeSourcesInputSchema, input);
    const knowledgeBaseId = this.ids.fromPublic(IdPrefix.KnowledgeBase, parsed.knowledgeBaseId);
    return this.tenants.run(workspaceId, async () => {
      const knowledgeBase = await this.knowledgeBases.findById(workspaceId, knowledgeBaseId);
      if (knowledgeBase === null) {
        throw new KnowledgeBaseNotFoundError();
      }
      return this.views.views(await this.sources.listByKnowledgeBase(workspaceId, knowledgeBaseId));
    });
  }
}
