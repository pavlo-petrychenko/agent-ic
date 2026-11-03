import { Injectable, Logger } from '@nestjs/common';
import { KnowledgeLogMessage } from '@/modules/knowledge/constants/knowledge-log.constants';
import {
  KnowledgeDocumentStatus,
  KnowledgeSourceStatus,
} from '@/modules/knowledge/constants/knowledge.constants';
import { knowledgeFailure } from '@/modules/knowledge/helpers/knowledge-ingestion.helpers';
import { DocumentsRepository } from '@/modules/knowledge/repositories/documents.repository';
import { SourcesRepository } from '@/modules/knowledge/repositories/sources.repository';
import { KnowledgeDocumentReindexService } from '@/modules/knowledge/services/knowledge-document-reindex.service';
import type { ReindexKnowledgeDocumentJobData } from '@/modules/knowledge/typedefs/knowledge-job.typedefs';
import { WorkspaceAccessDeniedError } from '@/platform/context/errors/workspace-access-denied.error';
import { requireSystemActor } from '@/platform/context/helpers/use-case-ctx.helpers';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { JobFailureAction } from '@/platform/errors/constants/job-failure.constants';
import { jobFailureActionFor } from '@/platform/errors/helpers/job-failure.helpers';
import { JOB_ATTEMPTS } from '@/platform/queues/constants/queue.constants';

@Injectable()
export class ReindexKnowledgeDocumentUseCase {
  private readonly logger = new Logger(ReindexKnowledgeDocumentUseCase.name);

  constructor(
    private readonly tenants: TenantTransactionService,
    private readonly reindex: KnowledgeDocumentReindexService,
    private readonly documents: DocumentsRepository,
    private readonly sources: SourcesRepository,
  ) {}

  async execute(ctx: UseCaseCtx, input: ReindexKnowledgeDocumentJobData): Promise<void> {
    requireSystemActor(ctx);
    const workspaceId = ctx.workspaceId;
    if (workspaceId === null) {
      throw new WorkspaceAccessDeniedError();
    }
    try {
      await this.reindex.reindex({ workspaceId, documentId: input.documentId });
    } catch (error) {
      this.logger.warn({
        msg: KnowledgeLogMessage.ReindexFailed,
        documentId: input.documentId,
        err: error,
      });
      if (this.shouldFinishOnFailure(ctx, error)) {
        await this.markFailed(workspaceId, input.documentId, error);
      }
      throw error;
    }
  }

  private shouldFinishOnFailure(ctx: UseCaseCtx, error: unknown): boolean {
    return jobFailureActionFor(error) === JobFailureAction.GiveUp || this.isFinalAttempt(ctx);
  }

  private isFinalAttempt(ctx: UseCaseCtx): boolean {
    return ctx.jobAttempt === undefined || ctx.jobAttempt >= JOB_ATTEMPTS;
  }

  private async markFailed(workspaceId: string, documentId: string, error: unknown): Promise<void> {
    const failure = knowledgeFailure(error);
    await this.tenants.run(workspaceId, async () => {
      const document = await this.documents.findByIdForUpdate(workspaceId, documentId);
      if (document === null) {
        return;
      }
      await this.documents.update(workspaceId, documentId, {
        status: KnowledgeDocumentStatus.Error,
        errorCode: failure.code,
        errorMessage: failure.message,
      });
      const source = await this.sources.findByIdForUpdate(workspaceId, document.sourceId);
      if (source === null) {
        return;
      }
      await this.sources.update(workspaceId, source.id, {
        status: KnowledgeSourceStatus.Error,
        lastErrorCode: failure.code,
        lastErrorMessage: failure.message,
      });
    });
  }
}
