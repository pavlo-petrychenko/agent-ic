import { IdPrefix, PermissionAction, PermissionResource } from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import { KnowledgeSourceStatus } from '@/modules/knowledge/constants/knowledge.constants';
import { KnowledgeSourceBusyError } from '@/modules/knowledge/errors/knowledge-source-busy.error';
import { KnowledgeSourceNotFoundError } from '@/modules/knowledge/errors/knowledge-source-not-found.error';
import { parseKnowledgeInput } from '@/modules/knowledge/helpers/knowledge-input.helpers';
import { cleanUpKnowledgeSourceFilesJob } from '@/modules/knowledge/jobs/clean-up-knowledge-source-files.job';
import { ChunksRepository } from '@/modules/knowledge/repositories/chunks.repository';
import { DocumentsRepository } from '@/modules/knowledge/repositories/documents.repository';
import { KnowledgeBasesRepository } from '@/modules/knowledge/repositories/knowledge-bases.repository';
import { KnowledgeStatsRepository } from '@/modules/knowledge/repositories/knowledge-stats.repository';
import { SectionsRepository } from '@/modules/knowledge/repositories/sections.repository';
import { SourcesRepository } from '@/modules/knowledge/repositories/sources.repository';
import { SyncRunsRepository } from '@/modules/knowledge/repositories/sync-runs.repository';
import { deleteKnowledgeSourceInputSchema } from '@/modules/knowledge/schemas/knowledge-input.schema';
import type { DeleteKnowledgeSourceInput } from '@/modules/knowledge/typedefs/source.typedefs';
import { ClockService } from '@/platform/clock/services/clock.service';
import { authorize } from '@/platform/context/helpers/authorize.helpers';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { IdService } from '@/platform/ids/services/id.service';
import { JobsService } from '@/platform/queues/services/jobs.service';

@Injectable()
export class DeleteKnowledgeSourceUseCase {
  constructor(
    private readonly tenants: TenantTransactionService,
    private readonly sources: SourcesRepository,
    private readonly documents: DocumentsRepository,
    private readonly sections: SectionsRepository,
    private readonly chunks: ChunksRepository,
    private readonly knowledgeBases: KnowledgeBasesRepository,
    private readonly stats: KnowledgeStatsRepository,
    private readonly syncRuns: SyncRunsRepository,
    private readonly jobs: JobsService,
    private readonly clock: ClockService,
    private readonly ids: IdService,
  ) {}

  async execute(
    ctx: UseCaseCtx,
    input: DeleteKnowledgeSourceInput,
  ): Promise<DeleteKnowledgeSourceInput> {
    const { workspaceId } = authorize(
      ctx,
      PermissionResource.KnowledgeBases,
      PermissionAction.Edit,
    );
    const parsed = parseKnowledgeInput(deleteKnowledgeSourceInputSchema, input);
    const sourceId = this.ids.fromPublic(IdPrefix.KnowledgeSource, parsed.id);

    await this.tenants.run(workspaceId, async () => {
      const source = await this.sources.findByIdForUpdate(workspaceId, sourceId);
      if (source === null) {
        throw new KnowledgeSourceNotFoundError();
      }
      const activeRun = await this.syncRuns.findActiveBySource(workspaceId, source.id);
      if (
        source.status === KnowledgeSourceStatus.Pending ||
        source.status === KnowledgeSourceStatus.Indexing ||
        activeRun !== null
      ) {
        throw new KnowledgeSourceBusyError();
      }

      const deletedAt = this.clock.now();
      const documents = await this.documents.listAllBySource(workspaceId, source.id);
      for (const document of documents) {
        await this.documents.softDelete(workspaceId, document.id, deletedAt);
        await this.chunks.deleteByDocument(workspaceId, document.id);
        await this.sections.deleteByDocument(workspaceId, document.id);
      }
      await this.sources.softDelete(workspaceId, source.id, deletedAt);
      await this.knowledgeBases.update(
        workspaceId,
        source.kbId,
        await this.stats.knowledgeBaseCounts(workspaceId, source.kbId),
      );
      await this.jobs.enqueue(
        ctx,
        cleanUpKnowledgeSourceFilesJob,
        { sourceId: source.id },
        { durable: true },
      );
    });

    return { id: parsed.id };
  }
}
