import { Injectable } from '@nestjs/common';
import {
  KnowledgeDocumentStatus,
  KnowledgeSourceStatus,
  KnowledgeSyncStatus,
} from '@/modules/knowledge/constants/knowledge.constants';
import {
  isDocumentFailure,
  knowledgeFailure,
} from '@/modules/knowledge/helpers/knowledge-ingestion.helpers';
import { DocumentsRepository } from '@/modules/knowledge/repositories/documents.repository';
import { KnowledgeBasesRepository } from '@/modules/knowledge/repositories/knowledge-bases.repository';
import { SourcesRepository } from '@/modules/knowledge/repositories/sources.repository';
import { SyncRunsRepository } from '@/modules/knowledge/repositories/sync-runs.repository';
import { KnowledgeDocumentIngestionService } from '@/modules/knowledge/services/knowledge-document-ingestion.service';
import type {
  IngestKnowledgeSourceJobData,
  KnowledgeFailure,
} from '@/modules/knowledge/typedefs/knowledge-job.typedefs';
import { ClockService } from '@/platform/clock/services/clock.service';
import { WorkspaceAccessDeniedError } from '@/platform/context/errors/workspace-access-denied.error';
import { requireSystemActor } from '@/platform/context/helpers/use-case-ctx.helpers';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';

@Injectable()
export class IngestKnowledgeSourceUseCase {
  constructor(
    private readonly tenants: TenantTransactionService,
    private readonly sources: SourcesRepository,
    private readonly documents: DocumentsRepository,
    private readonly syncRuns: SyncRunsRepository,
    private readonly knowledgeBases: KnowledgeBasesRepository,
    private readonly ingestion: KnowledgeDocumentIngestionService,
    private readonly clock: ClockService,
  ) {}

  async execute(ctx: UseCaseCtx, { sourceId }: IngestKnowledgeSourceJobData): Promise<void> {
    requireSystemActor(ctx);
    const workspaceId = ctx.workspaceId;
    if (workspaceId === null) {
      throw new WorkspaceAccessDeniedError();
    }
    const loaded = await this.tenants.run(workspaceId, async () => {
      const source = await this.sources.findById(workspaceId, sourceId);
      if (source === null) {
        return null;
      }
      const knowledgeBase = await this.knowledgeBases.findById(workspaceId, source.kbId);
      if (knowledgeBase === null) {
        return null;
      }
      return {
        source,
        knowledgeBase,
        documents: await this.documents.listBySource(workspaceId, source.id),
        syncRun: await this.syncRuns.findLatestBySource(workspaceId, source.id),
      };
    });
    if (loaded === null) {
      return;
    }
    const syncRunId = loaded.syncRun?.id ?? null;
    const startedAt = this.clock.now();
    await this.tenants.run(workspaceId, async () => {
      await this.sources.update(workspaceId, sourceId, {
        status: KnowledgeSourceStatus.Indexing,
        lastErrorCode: null,
        lastErrorMessage: null,
      });
      if (syncRunId !== null) {
        await this.syncRuns.update(workspaceId, syncRunId, {
          status: KnowledgeSyncStatus.Running,
          startedAt,
          finishedAt: null,
          documentsTotal: loaded.documents.length,
          documentsIndexed: 0,
          documentsSkipped: 0,
          documentsFailed: 0,
          documentsRemoved: 0,
          errorCode: null,
          errorMessage: null,
        });
      }
    });

    let indexed = 0;
    let skipped = 0;
    let failed = 0;
    let failure: KnowledgeFailure | null = null;
    try {
      for (const document of loaded.documents) {
        await this.markDocument(workspaceId, document.id, KnowledgeDocumentStatus.Indexing, null);
        try {
          const result = await this.ingestion.ingest({
            workspaceId,
            knowledgeBase: loaded.knowledgeBase,
            document,
          });
          if (result.skipped) {
            skipped += 1;
            await this.markDocument(
              workspaceId,
              document.id,
              KnowledgeDocumentStatus.Indexed,
              null,
            );
          } else {
            indexed += 1;
          }
        } catch (error) {
          failure = knowledgeFailure(error);
          await this.markDocument(workspaceId, document.id, KnowledgeDocumentStatus.Error, failure);
          if (!isDocumentFailure(error)) {
            throw error;
          }
          failed += 1;
        }
        if (syncRunId !== null) {
          await this.tenants.run(workspaceId, () =>
            this.syncRuns.update(workspaceId, syncRunId, {
              documentsTotal: loaded.documents.length,
              documentsIndexed: indexed,
              documentsSkipped: skipped,
              documentsFailed: failed,
            }),
          );
        }
      }

      const finishedAt = this.clock.now();
      const runStatus =
        failed === 0
          ? KnowledgeSyncStatus.Succeeded
          : failed === loaded.documents.length
            ? KnowledgeSyncStatus.Failed
            : KnowledgeSyncStatus.Partial;
      await this.tenants.run(workspaceId, async () => {
        await this.sources.update(workspaceId, sourceId, {
          status: failed === 0 ? KnowledgeSourceStatus.Ready : KnowledgeSourceStatus.Error,
          lastSyncAt: finishedAt,
          lastErrorCode: failure?.code ?? null,
          lastErrorMessage: failure?.message ?? null,
        });
        if (syncRunId !== null) {
          await this.syncRuns.update(workspaceId, syncRunId, {
            status: runStatus,
            documentsTotal: loaded.documents.length,
            documentsIndexed: indexed,
            documentsSkipped: skipped,
            documentsFailed: failed,
            finishedAt,
            errorCode: failure?.code ?? null,
            errorMessage: failure?.message ?? null,
          });
        }
      });
    } catch (error) {
      const thrownFailure = knowledgeFailure(error);
      const finishedAt = this.clock.now();
      await this.tenants.run(workspaceId, async () => {
        await this.sources.update(workspaceId, sourceId, {
          status: KnowledgeSourceStatus.Error,
          lastSyncAt: finishedAt,
          lastErrorCode: thrownFailure.code,
          lastErrorMessage: thrownFailure.message,
        });
        if (syncRunId !== null) {
          await this.syncRuns.update(workspaceId, syncRunId, {
            status: KnowledgeSyncStatus.Failed,
            documentsTotal: loaded.documents.length,
            documentsIndexed: indexed,
            documentsSkipped: skipped,
            documentsFailed: failed,
            finishedAt,
            errorCode: thrownFailure.code,
            errorMessage: thrownFailure.message,
          });
        }
      });
      throw error;
    }
  }

  private async markDocument(
    workspaceId: string,
    documentId: string,
    status: KnowledgeDocumentStatus,
    failure: KnowledgeFailure | null,
  ): Promise<void> {
    await this.tenants.run(workspaceId, () =>
      this.documents.update(workspaceId, documentId, {
        status,
        errorCode: failure?.code ?? null,
        errorMessage: failure?.message ?? null,
      }),
    );
  }
}
