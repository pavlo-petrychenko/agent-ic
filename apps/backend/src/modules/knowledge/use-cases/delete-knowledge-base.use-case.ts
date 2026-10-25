import { IdPrefix, PermissionAction, PermissionResource } from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import { KnowledgeBaseHasSourcesError } from '@/modules/knowledge/errors/knowledge-base-has-sources.error';
import { KnowledgeBaseNotFoundError } from '@/modules/knowledge/errors/knowledge-base-not-found.error';
import { parseKnowledgeInput } from '@/modules/knowledge/helpers/knowledge-input.helpers';
import { ChunkTermsRepository } from '@/modules/knowledge/repositories/chunk-terms.repository';
import { ChunksRepository } from '@/modules/knowledge/repositories/chunks.repository';
import { KnowledgeBasesRepository } from '@/modules/knowledge/repositories/knowledge-bases.repository';
import { SectionsRepository } from '@/modules/knowledge/repositories/sections.repository';
import { SourcesRepository } from '@/modules/knowledge/repositories/sources.repository';
import { deleteKnowledgeBaseInputSchema } from '@/modules/knowledge/schemas/knowledge-input.schema';
import type { DeleteKnowledgeBaseInput } from '@/modules/knowledge/typedefs/knowledge-base.typedefs';
import { ClockService } from '@/platform/clock/services/clock.service';
import { authorize } from '@/platform/context/helpers/authorize.helpers';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { IdService } from '@/platform/ids/services/id.service';

@Injectable()
export class DeleteKnowledgeBaseUseCase {
  constructor(
    private readonly tenantTransactions: TenantTransactionService,
    private readonly knowledgeBases: KnowledgeBasesRepository,
    private readonly sources: SourcesRepository,
    private readonly sections: SectionsRepository,
    private readonly chunks: ChunksRepository,
    private readonly chunkTerms: ChunkTermsRepository,
    private readonly clock: ClockService,
    private readonly ids: IdService,
  ) {}

  async execute(
    ctx: UseCaseCtx,
    input: DeleteKnowledgeBaseInput,
  ): Promise<DeleteKnowledgeBaseInput> {
    const { workspaceId } = authorize(
      ctx,
      PermissionResource.KnowledgeBases,
      PermissionAction.Delete,
    );
    const { id } = parseKnowledgeInput(deleteKnowledgeBaseInputSchema, input);
    const knowledgeBaseId = this.ids.fromPublic(IdPrefix.KnowledgeBase, id);
    await this.tenantTransactions.run(workspaceId, async () => {
      if ((await this.knowledgeBases.findByIdForUpdate(workspaceId, knowledgeBaseId)) === null) {
        throw new KnowledgeBaseNotFoundError();
      }
      if (await this.sources.hasActiveByKnowledgeBase(workspaceId, knowledgeBaseId)) {
        throw new KnowledgeBaseHasSourcesError();
      }
      const deletedAt = this.clock.now();
      await this.chunkTerms.deleteByKnowledgeBase(workspaceId, knowledgeBaseId);
      await this.chunks.deleteByKnowledgeBase(workspaceId, knowledgeBaseId);
      await this.sections.deleteByKnowledgeBase(workspaceId, knowledgeBaseId);
      await this.knowledgeBases.softDelete(workspaceId, knowledgeBaseId, deletedAt);
    });
    return { id };
  }
}
