import { IdPrefix, PermissionAction, PermissionResource } from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import {
  KnowledgeDocumentStatus,
  KnowledgeSourceKind,
  KnowledgeSourceStatus,
  KnowledgeSummarySource,
} from '@/modules/knowledge/constants/knowledge.constants';
import { KnowledgeDocumentBusyError } from '@/modules/knowledge/errors/knowledge-document-busy.error';
import { KnowledgeDocumentNotEditableError } from '@/modules/knowledge/errors/knowledge-document-not-editable.error';
import { KnowledgeDocumentNotFoundError } from '@/modules/knowledge/errors/knowledge-document-not-found.error';
import { KnowledgeSourceBusyError } from '@/modules/knowledge/errors/knowledge-source-busy.error';
import { parseKnowledgeInput } from '@/modules/knowledge/helpers/knowledge-input.helpers';
import { reindexKnowledgeDocumentJob } from '@/modules/knowledge/jobs/reindex-knowledge-document.job';
import { DocumentsRepository } from '@/modules/knowledge/repositories/documents.repository';
import { SourcesRepository } from '@/modules/knowledge/repositories/sources.repository';
import { SyncRunsRepository } from '@/modules/knowledge/repositories/sync-runs.repository';
import { updateDocumentSummaryInputSchema } from '@/modules/knowledge/schemas/knowledge-input.schema';
import { KnowledgeSourceViewsService } from '@/modules/knowledge/services/knowledge-source-views.service';
import type { UpdateDocumentSummaryInput } from '@/modules/knowledge/typedefs/document-summary.typedefs';
import type { KnowledgeSourceDocumentView } from '@/modules/knowledge/typedefs/source.typedefs';
import { ClockService } from '@/platform/clock/services/clock.service';
import { authorize } from '@/platform/context/helpers/authorize.helpers';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { IdService } from '@/platform/ids/services/id.service';
import { JobsService } from '@/platform/queues/services/jobs.service';

@Injectable()
export class UpdateDocumentSummaryUseCase {
  constructor(
    private readonly tenants: TenantTransactionService,
    private readonly documents: DocumentsRepository,
    private readonly sources: SourcesRepository,
    private readonly syncRuns: SyncRunsRepository,
    private readonly views: KnowledgeSourceViewsService,
    private readonly jobs: JobsService,
    private readonly clock: ClockService,
    private readonly ids: IdService,
  ) {}

  async execute(
    ctx: UseCaseCtx,
    input: UpdateDocumentSummaryInput,
  ): Promise<KnowledgeSourceDocumentView> {
    const { workspaceId } = authorize(
      ctx,
      PermissionResource.KnowledgeBases,
      PermissionAction.Edit,
    );
    const parsed = parseKnowledgeInput(updateDocumentSummaryInputSchema, input);
    const documentId = this.ids.fromPublic(IdPrefix.KnowledgeDocument, parsed.id);

    return this.tenants.run(workspaceId, async () => {
      const document = await this.documents.findByIdForUpdate(workspaceId, documentId);
      if (document === null) {
        throw new KnowledgeDocumentNotFoundError();
      }
      const source = await this.sources.findByIdForUpdate(workspaceId, document.sourceId);
      if (source === null || source.kind !== KnowledgeSourceKind.GoogleDocs) {
        throw new KnowledgeDocumentNotEditableError();
      }
      const activeRun = await this.syncRuns.findActiveBySource(workspaceId, source.id);
      if (
        source.status === KnowledgeSourceStatus.Pending ||
        source.status === KnowledgeSourceStatus.Indexing ||
        activeRun !== null
      ) {
        throw new KnowledgeSourceBusyError();
      }
      if (
        document.status === KnowledgeDocumentStatus.Pending ||
        document.status === KnowledgeDocumentStatus.Indexing
      ) {
        throw new KnowledgeDocumentBusyError();
      }
      if (document.status !== KnowledgeDocumentStatus.Indexed || document.staleAt !== null) {
        throw new KnowledgeDocumentNotEditableError();
      }

      const now = this.clock.now();
      const changed = parsed.summary !== (document.summary?.trim() ?? '');
      const updated = await this.documents.update(workspaceId, document.id, {
        summary: parsed.summary,
        summarySource: KnowledgeSummarySource.User,
        summaryUpdatedAt: now,
        ...(changed
          ? {
              status: KnowledgeDocumentStatus.Indexing,
              errorCode: null,
              errorMessage: null,
            }
          : {}),
      });
      if (updated === null) {
        throw new KnowledgeDocumentNotFoundError();
      }
      if (changed) {
        await this.jobs.enqueue(
          ctx,
          reindexKnowledgeDocumentJob,
          { documentId: document.id },
          { durable: true },
        );
      }
      return this.views.documentView(updated);
    });
  }
}
