import { Injectable } from '@nestjs/common';
import {
  KnowledgeDocumentStatus,
  KnowledgeSourceStatus,
  KnowledgeSyncStatus,
  KnowledgeSyncTrigger,
} from '@/modules/knowledge/constants/knowledge.constants';
import { KnowledgeSourceBusyError } from '@/modules/knowledge/errors/knowledge-source-busy.error';
import { ingestKnowledgeSourceJob } from '@/modules/knowledge/jobs/ingest-knowledge-source.job';
import { DocumentsRepository } from '@/modules/knowledge/repositories/documents.repository';
import { SourcesRepository } from '@/modules/knowledge/repositories/sources.repository';
import { SyncRunsRepository } from '@/modules/knowledge/repositories/sync-runs.repository';
import type { Document } from '@/modules/knowledge/typedefs/document.typedefs';
import type { QueueKnowledgeSourceSyncInput } from '@/modules/knowledge/typedefs/knowledge-source-sync.typedefs';
import type { Source } from '@/modules/knowledge/typedefs/source.typedefs';
import { IdService } from '@/platform/ids/services/id.service';
import { JobsService } from '@/platform/queues/services/jobs.service';

@Injectable()
export class KnowledgeSourceSyncService {
  constructor(
    private readonly sources: SourcesRepository,
    private readonly documents: DocumentsRepository,
    private readonly syncRuns: SyncRunsRepository,
    private readonly jobs: JobsService,
    private readonly ids: IdService,
  ) {}

  async documentsForManualSync(workspaceId: string, source: Source): Promise<readonly Document[]> {
    const documents = await this.documents.listBySource(workspaceId, source.id);
    await this.assertOwnerRunsIdle(workspaceId, source.id, documents);
    return documents;
  }

  async failedDocumentsForRetry(workspaceId: string, source: Source): Promise<readonly Document[]> {
    const documents = await this.documents.listBySource(workspaceId, source.id);
    const failedDocuments = documents.filter(
      (document) => document.status === KnowledgeDocumentStatus.Error,
    );
    await this.assertOwnerRunsIdle(workspaceId, source.id, failedDocuments);
    return failedDocuments;
  }

  private async assertOwnerRunsIdle(
    workspaceId: string,
    sourceId: string,
    documents: readonly Document[],
  ): Promise<void> {
    const ownerSourceIds = new Set(documents.map((document) => document.sourceId));
    for (const ownerSourceId of ownerSourceIds) {
      if (ownerSourceId === sourceId) {
        continue;
      }
      const ownerRun = await this.syncRuns.findActiveBySource(workspaceId, ownerSourceId);
      if (ownerRun !== null) {
        throw new KnowledgeSourceBusyError();
      }
    }
  }

  async queue({
    ctx,
    workspaceId,
    source,
    documents,
    resetFailedDocuments,
  }: QueueKnowledgeSourceSyncInput): Promise<string> {
    const syncRunId = this.ids.generate();
    await this.sources.update(workspaceId, source.id, {
      status: KnowledgeSourceStatus.Pending,
      lastErrorCode: null,
      lastErrorMessage: null,
    });
    if (resetFailedDocuments) {
      for (const document of documents) {
        if (document.status === KnowledgeDocumentStatus.Error) {
          await this.documents.update(workspaceId, document.id, {
            status: KnowledgeDocumentStatus.Pending,
            errorCode: null,
            errorMessage: null,
          });
        }
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
      { sourceId: source.id, syncRunId, documentIds: documents.map((document) => document.id) },
      { durable: true, jobId: syncRunId },
    );
    return syncRunId;
  }
}
