import { IdPrefix, PermissionAction, PermissionResource } from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import {
  KnowledgeDocumentStatus,
  KnowledgeSourceKind,
  KnowledgeSourceStatus,
} from '@/modules/knowledge/constants/knowledge.constants';
import { KnowledgeDocumentNotInSourceError } from '@/modules/knowledge/errors/knowledge-document-not-in-source.error';
import { KnowledgeDocumentNotRemovableError } from '@/modules/knowledge/errors/knowledge-document-not-removable.error';
import { KnowledgeSourceBusyError } from '@/modules/knowledge/errors/knowledge-source-busy.error';
import { KnowledgeSourceLastDocumentError } from '@/modules/knowledge/errors/knowledge-source-last-document.error';
import { KnowledgeSourceNotFoundError } from '@/modules/knowledge/errors/knowledge-source-not-found.error';
import { googleDocsSourceTitleAfterRemoval } from '@/modules/knowledge/helpers/google-picker.helpers';
import { parseKnowledgeInput } from '@/modules/knowledge/helpers/knowledge-input.helpers';
import { knowledgeSourceStateForDocuments } from '@/modules/knowledge/helpers/knowledge-source-state.helpers';
import { cleanUpKnowledgeDocumentFilesJob } from '@/modules/knowledge/jobs/clean-up-knowledge-document-files.job';
import { ChunksRepository } from '@/modules/knowledge/repositories/chunks.repository';
import { DocumentsRepository } from '@/modules/knowledge/repositories/documents.repository';
import { KnowledgeBasesRepository } from '@/modules/knowledge/repositories/knowledge-bases.repository';
import { KnowledgeStatsRepository } from '@/modules/knowledge/repositories/knowledge-stats.repository';
import { SectionsRepository } from '@/modules/knowledge/repositories/sections.repository';
import { SourceDocumentsRepository } from '@/modules/knowledge/repositories/source-documents.repository';
import { SourcesRepository } from '@/modules/knowledge/repositories/sources.repository';
import { SyncRunsRepository } from '@/modules/knowledge/repositories/sync-runs.repository';
import { removeSourceDocumentInputSchema } from '@/modules/knowledge/schemas/knowledge-input.schema';
import type { RemoveSourceDocumentInput } from '@/modules/knowledge/typedefs/source.typedefs';
import { ClockService } from '@/platform/clock/services/clock.service';
import { authorize } from '@/platform/context/helpers/authorize.helpers';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { IdService } from '@/platform/ids/services/id.service';
import { JobsService } from '@/platform/queues/services/jobs.service';

@Injectable()
export class RemoveSourceDocumentUseCase {
  constructor(
    private readonly tenants: TenantTransactionService,
    private readonly sources: SourcesRepository,
    private readonly sourceDocuments: SourceDocumentsRepository,
    private readonly documents: DocumentsRepository,
    private readonly chunks: ChunksRepository,
    private readonly sections: SectionsRepository,
    private readonly knowledgeBases: KnowledgeBasesRepository,
    private readonly stats: KnowledgeStatsRepository,
    private readonly syncRuns: SyncRunsRepository,
    private readonly jobs: JobsService,
    private readonly clock: ClockService,
    private readonly ids: IdService,
  ) {}

  async execute(
    ctx: UseCaseCtx,
    input: RemoveSourceDocumentInput,
  ): Promise<RemoveSourceDocumentInput> {
    const { workspaceId } = authorize(
      ctx,
      PermissionResource.KnowledgeBases,
      PermissionAction.Edit,
    );
    const parsed = parseKnowledgeInput(removeSourceDocumentInputSchema, input);
    const sourceId = this.ids.fromPublic(IdPrefix.KnowledgeSource, parsed.sourceId);
    const documentId = this.ids.fromPublic(IdPrefix.KnowledgeDocument, parsed.documentId);

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

      const linkedDocuments = await this.documents.listBySource(workspaceId, source.id);
      const linkedDocument = linkedDocuments.find((document) => document.id === documentId);
      if (linkedDocument === undefined) {
        throw new KnowledgeDocumentNotInSourceError();
      }
      if (linkedDocuments.length <= 1) {
        throw new KnowledgeSourceLastDocumentError();
      }

      const document = await this.documents.findByIdForUpdate(workspaceId, documentId);
      if (document === null) {
        throw new KnowledgeDocumentNotInSourceError();
      }
      if (
        document.status === KnowledgeDocumentStatus.Pending ||
        document.status === KnowledgeDocumentStatus.Indexing
      ) {
        throw new KnowledgeDocumentNotRemovableError();
      }

      const linkRemoved = await this.sourceDocuments.deleteLink(
        workspaceId,
        source.id,
        document.id,
      );
      if (!linkRemoved) {
        throw new KnowledgeDocumentNotInSourceError();
      }

      if (document.sourceId === source.id) {
        const [nextOwnerSourceId] = await this.sourceDocuments.listOtherSourceIds(
          workspaceId,
          document.id,
          source.id,
        );
        if (nextOwnerSourceId !== undefined) {
          await this.documents.update(workspaceId, document.id, {
            sourceId: nextOwnerSourceId,
          });
        } else {
          const deletedAt = this.clock.now();
          await this.documents.update(workspaceId, document.id, {
            status: KnowledgeDocumentStatus.Removed,
            deletedAt,
          });
          await this.chunks.deleteByDocument(workspaceId, document.id);
          await this.sections.deleteByDocument(workspaceId, document.id);
          await this.jobs.enqueue(
            ctx,
            cleanUpKnowledgeDocumentFilesJob,
            { documentId: document.id },
            { durable: true },
          );
        }
      }

      const remainingDocuments = await this.documents.listBySource(workspaceId, source.id);
      if (remainingDocuments.length === 0) {
        throw new KnowledgeSourceLastDocumentError();
      }
      const state = knowledgeSourceStateForDocuments(remainingDocuments);
      const counts = await this.stats.sourceCounts(workspaceId, source.id);
      const title =
        source.kind === KnowledgeSourceKind.GoogleDocs
          ? googleDocsSourceTitleAfterRemoval(
              source.title,
              linkedDocuments.map((linked) => linked.title),
              remainingDocuments.map((linked) => linked.title),
            )
          : null;
      const updated = await this.sources.update(workspaceId, source.id, {
        status: state.status,
        lastErrorCode: state.lastErrorCode,
        lastErrorMessage: state.lastErrorMessage,
        ...counts,
        ...(title === null ? {} : { title }),
      });
      if (updated === null) {
        throw new KnowledgeSourceNotFoundError();
      }
      await this.knowledgeBases.update(
        workspaceId,
        source.kbId,
        await this.stats.knowledgeBaseCounts(workspaceId, source.kbId),
      );
    });

    return { sourceId: parsed.sourceId, documentId: parsed.documentId };
  }
}
