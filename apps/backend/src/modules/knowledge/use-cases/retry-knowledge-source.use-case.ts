import { IdPrefix, PermissionAction, PermissionResource } from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import {
  KnowledgeDocumentStatus,
  KnowledgeSourceStatus,
  KnowledgeSyncStatus,
  KnowledgeSyncTrigger,
} from '@/modules/knowledge/constants/knowledge.constants';
import { KnowledgeSourceBusyError } from '@/modules/knowledge/errors/knowledge-source-busy.error';
import { KnowledgeSourceNotFoundError } from '@/modules/knowledge/errors/knowledge-source-not-found.error';
import { KnowledgeSourceNotRetryableError } from '@/modules/knowledge/errors/knowledge-source-not-retryable.error';
import { parseKnowledgeInput } from '@/modules/knowledge/helpers/knowledge-input.helpers';
import { ingestKnowledgeSourceJob } from '@/modules/knowledge/jobs/ingest-knowledge-source.job';
import { DocumentsRepository } from '@/modules/knowledge/repositories/documents.repository';
import { SourcesRepository } from '@/modules/knowledge/repositories/sources.repository';
import { SyncRunsRepository } from '@/modules/knowledge/repositories/sync-runs.repository';
import { retryKnowledgeSourceInputSchema } from '@/modules/knowledge/schemas/knowledge-input.schema';
import type { RetryKnowledgeSourceInput } from '@/modules/knowledge/typedefs/source.typedefs';
import { authorize } from '@/platform/context/helpers/authorize.helpers';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { IdService } from '@/platform/ids/services/id.service';
import { JobsService } from '@/platform/queues/services/jobs.service';

@Injectable()
export class RetryKnowledgeSourceUseCase {
  constructor(
    private readonly tenants: TenantTransactionService,
    private readonly sources: SourcesRepository,
    private readonly documents: DocumentsRepository,
    private readonly syncRuns: SyncRunsRepository,
    private readonly jobs: JobsService,
    private readonly ids: IdService,
  ) {}

  async execute(
    ctx: UseCaseCtx,
    input: RetryKnowledgeSourceInput,
  ): Promise<RetryKnowledgeSourceInput> {
    const { workspaceId } = authorize(
      ctx,
      PermissionResource.KnowledgeBases,
      PermissionAction.Edit,
    );
    const parsed = parseKnowledgeInput(retryKnowledgeSourceInputSchema, input);
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
      if (source.status !== KnowledgeSourceStatus.Error) {
        throw new KnowledgeSourceNotRetryableError();
      }

      const documents = await this.documents.listBySource(workspaceId, source.id);
      if (documents.length === 0) {
        throw new KnowledgeSourceNotRetryableError();
      }

      const syncRunId = this.ids.generate();
      await this.sources.update(workspaceId, source.id, {
        status: KnowledgeSourceStatus.Pending,
        lastErrorCode: null,
        lastErrorMessage: null,
      });
      for (const document of documents) {
        if (document.status === KnowledgeDocumentStatus.Error) {
          await this.documents.update(workspaceId, document.id, {
            status: KnowledgeDocumentStatus.Pending,
            errorCode: null,
            errorMessage: null,
          });
        }
      }
      await this.syncRuns.insert({
        id: syncRunId,
        workspaceId,
        sourceId: source.id,
        trigger: KnowledgeSyncTrigger.Manual,
        status: KnowledgeSyncStatus.Queued,
        documentsTotal: documents.length,
      });
      await this.jobs.enqueue(
        ctx,
        ingestKnowledgeSourceJob,
        { sourceId: source.id, syncRunId },
        { durable: true, jobId: syncRunId },
      );
    });

    return { id: parsed.id };
  }
}
