import { ErrorReason } from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import { KNOWLEDGE_SOURCE_BUSY_MESSAGE } from '@/modules/knowledge/constants/knowledge-error.constants';
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
import { KnowledgeStatsRepository } from '@/modules/knowledge/repositories/knowledge-stats.repository';
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
import { JobFailureAction } from '@/platform/errors/constants/job-failure.constants';
import { jobFailureActionFor } from '@/platform/errors/helpers/job-failure.helpers';
import { JOB_ATTEMPTS } from '@/platform/queues/constants/queue.constants';

@Injectable()
export class IngestKnowledgeSourceUseCase {
  constructor(
    private readonly tenants: TenantTransactionService,
    private readonly sources: SourcesRepository,
    private readonly documents: DocumentsRepository,
    private readonly syncRuns: SyncRunsRepository,
    private readonly knowledgeBases: KnowledgeBasesRepository,
    private readonly stats: KnowledgeStatsRepository,
    private readonly ingestion: KnowledgeDocumentIngestionService,
    private readonly clock: ClockService,
  ) {}

  async execute(
    ctx: UseCaseCtx,
    { sourceId, syncRunId }: IngestKnowledgeSourceJobData,
  ): Promise<void> {
    requireSystemActor(ctx);
    const workspaceId = ctx.workspaceId;
    if (workspaceId === null) {
      throw new WorkspaceAccessDeniedError();
    }
    const startedAt = this.clock.now();
    const loaded = await this.tenants.run(workspaceId, async () => {
      const source = await this.sources.findByIdForUpdate(workspaceId, sourceId);
      if (source === null) {
        return null;
      }
      const knowledgeBase = await this.knowledgeBases.findById(workspaceId, source.kbId);
      if (knowledgeBase === null) {
        return null;
      }
      const syncRun = await this.syncRuns.findById(workspaceId, syncRunId);
      if (syncRun === null || syncRun.sourceId !== source.id) {
        return null;
      }
      if (syncRun.status === KnowledgeSyncStatus.Succeeded) {
        return null;
      }
      const active = await this.syncRuns.findActiveBySource(workspaceId, source.id);
      if (active !== null && active.id !== syncRun.id) {
        await this.syncRuns.update(workspaceId, syncRun.id, {
          status: KnowledgeSyncStatus.Failed,
          startedAt,
          finishedAt: startedAt,
          errorCode: ErrorReason.KnowledgeSourceBusy,
          errorMessage: KNOWLEDGE_SOURCE_BUSY_MESSAGE,
        });
        return null;
      }
      const documents = await this.documents.listBySource(workspaceId, source.id);
      await this.sources.update(workspaceId, sourceId, {
        status: KnowledgeSourceStatus.Indexing,
        lastErrorCode: null,
        lastErrorMessage: null,
      });
      await this.syncRuns.update(workspaceId, syncRun.id, {
        status: KnowledgeSyncStatus.Running,
        startedAt,
        finishedAt: null,
        documentsTotal: documents.length,
        documentsIndexed: 0,
        documentsSkipped: 0,
        documentsFailed: 0,
        documentsRemoved: 0,
        errorCode: null,
        errorMessage: null,
      });
      return { knowledgeBase, documents, syncRunId: syncRun.id };
    });
    if (loaded === null) {
      return;
    }

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
          const documentFailure = isDocumentFailure(error);
          if (documentFailure || this.isFinalAttempt(ctx)) {
            await this.markDocument(
              workspaceId,
              document.id,
              KnowledgeDocumentStatus.Error,
              failure,
            );
          }
          if (!documentFailure) {
            if (this.isFinalAttempt(ctx)) {
              failed += 1;
            }
            throw error;
          }
          failed += 1;
        }
        await this.updateProgress(workspaceId, loaded.syncRunId, {
          documentsTotal: loaded.documents.length,
          documentsIndexed: indexed,
          documentsSkipped: skipped,
          documentsFailed: failed,
        });
      }

      const finishedAt = this.clock.now();
      const runStatus =
        failed === 0
          ? KnowledgeSyncStatus.Succeeded
          : failed === loaded.documents.length
            ? KnowledgeSyncStatus.Failed
            : KnowledgeSyncStatus.Partial;
      await this.finish(workspaceId, loaded.knowledgeBase.id, sourceId, loaded.syncRunId, {
        status: runStatus,
        sourceStatus: failed === 0 ? KnowledgeSourceStatus.Ready : KnowledgeSourceStatus.Error,
        finishedAt,
        counters: {
          documentsTotal: loaded.documents.length,
          documentsIndexed: indexed,
          documentsSkipped: skipped,
          documentsFailed: failed,
        },
        failure,
      });
    } catch (error) {
      const thrownFailure = knowledgeFailure(error);
      if (this.shouldFinishOnFailure(ctx, error)) {
        const finishedAt = this.clock.now();
        await this.finish(workspaceId, loaded.knowledgeBase.id, sourceId, loaded.syncRunId, {
          status: KnowledgeSyncStatus.Failed,
          sourceStatus: KnowledgeSourceStatus.Error,
          finishedAt,
          counters: {
            documentsTotal: loaded.documents.length,
            documentsIndexed: indexed,
            documentsSkipped: skipped,
            documentsFailed: failed,
          },
          failure: thrownFailure,
        });
      }
      throw error;
    }
  }

  private isFinalAttempt(ctx: UseCaseCtx): boolean {
    return ctx.jobAttempt === undefined || ctx.jobAttempt >= JOB_ATTEMPTS;
  }

  private shouldFinishOnFailure(ctx: UseCaseCtx, error: unknown): boolean {
    return jobFailureActionFor(error) === JobFailureAction.GiveUp || this.isFinalAttempt(ctx);
  }

  private async updateProgress(
    workspaceId: string,
    syncRunId: string,
    counters: {
      readonly documentsTotal: number;
      readonly documentsIndexed: number;
      readonly documentsSkipped: number;
      readonly documentsFailed: number;
    },
  ): Promise<void> {
    await this.tenants.run(workspaceId, () =>
      this.syncRuns.update(workspaceId, syncRunId, counters),
    );
  }

  private async finish(
    workspaceId: string,
    knowledgeBaseId: string,
    sourceId: string,
    syncRunId: string,
    input: {
      readonly status: KnowledgeSyncStatus;
      readonly sourceStatus: KnowledgeSourceStatus;
      readonly finishedAt: Date;
      readonly counters: {
        readonly documentsTotal: number;
        readonly documentsIndexed: number;
        readonly documentsSkipped: number;
        readonly documentsFailed: number;
      };
      readonly failure: KnowledgeFailure | null;
    },
  ): Promise<void> {
    await this.tenants.run(workspaceId, async () => {
      await this.sources.update(workspaceId, sourceId, {
        status: input.sourceStatus,
        lastSyncAt: input.finishedAt,
        lastErrorCode: input.failure?.code ?? null,
        lastErrorMessage: input.failure?.message ?? null,
        ...(await this.stats.sourceCounts(workspaceId, sourceId)),
      });
      await this.knowledgeBases.update(workspaceId, knowledgeBaseId, {
        ...(await this.stats.knowledgeBaseCounts(workspaceId, knowledgeBaseId)),
      });
      await this.syncRuns.update(workspaceId, syncRunId, {
        status: input.status,
        ...input.counters,
        finishedAt: input.finishedAt,
        errorCode: input.failure?.code ?? null,
        errorMessage: input.failure?.message ?? null,
      });
    });
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
