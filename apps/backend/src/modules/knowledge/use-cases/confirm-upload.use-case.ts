import {
  IdPrefix,
  KNOWLEDGE_DOCUMENT_MAX_BYTES,
  PermissionAction,
  PermissionResource,
} from '@agent-ic/contracts';
import { Injectable, Logger } from '@nestjs/common';
import {
  knowledgeUploadConfirmedEntry,
  knowledgeUploadTicketEntry,
} from '@/modules/knowledge/constants/knowledge-upload-cache.constants';
import {
  KNOWLEDGE_UPLOAD_CLEANUP_FAILED_MESSAGE,
  KNOWLEDGE_UPLOAD_MARKER_FAILED_MESSAGE,
  KNOWLEDGE_UPLOAD_TICKET_DELETE_FAILED_MESSAGE,
} from '@/modules/knowledge/constants/knowledge-upload.constants';
import {
  KnowledgeDocumentStatus,
  KnowledgeSourceKind,
  KnowledgeSourceStatus,
  KnowledgeSyncStatus,
  KnowledgeSyncTrigger,
} from '@/modules/knowledge/constants/knowledge.constants';
import { KnowledgeUploadInvalidError } from '@/modules/knowledge/errors/knowledge-upload-invalid.error';
import { parseKnowledgeInput } from '@/modules/knowledge/helpers/knowledge-input.helpers';
import {
  knowledgeOriginalStorageKey,
  knowledgeUploadStorageKey,
} from '@/modules/knowledge/helpers/knowledge-storage.helpers';
import {
  normalizeUploadMimeType,
  uploadTitle,
} from '@/modules/knowledge/helpers/knowledge-upload.helpers';
import { ingestKnowledgeSourceJob } from '@/modules/knowledge/jobs/ingest-knowledge-source.job';
import { DocumentsRepository } from '@/modules/knowledge/repositories/documents.repository';
import { SourcesRepository } from '@/modules/knowledge/repositories/sources.repository';
import { SyncRunsRepository } from '@/modules/knowledge/repositories/sync-runs.repository';
import { confirmUploadInputSchema } from '@/modules/knowledge/schemas/knowledge-input.schema';
import { KnowledgeSourceViewsService } from '@/modules/knowledge/services/knowledge-source-views.service';
import type {
  ConfirmUploadInput,
  KnowledgeUploadTicket,
} from '@/modules/knowledge/typedefs/knowledge-upload.typedefs';
import type { KnowledgeSourceView, Source } from '@/modules/knowledge/typedefs/source.typedefs';
import { CacheService } from '@/platform/cache/services/cache.service';
import { authorize } from '@/platform/context/helpers/authorize.helpers';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { UpstreamError } from '@/platform/errors/errors/upstream.error';
import { IdService } from '@/platform/ids/services/id.service';
import { JobsService } from '@/platform/queues/services/jobs.service';
import { FileStorage } from '@/platform/storage/gateways/file-storage.gateway';

@Injectable()
export class ConfirmUploadUseCase {
  private readonly logger = new Logger(ConfirmUploadUseCase.name);

  constructor(
    private readonly tenants: TenantTransactionService,
    private readonly sources: SourcesRepository,
    private readonly documents: DocumentsRepository,
    private readonly syncRuns: SyncRunsRepository,
    private readonly views: KnowledgeSourceViewsService,
    private readonly storage: FileStorage,
    private readonly cache: CacheService,
    private readonly jobs: JobsService,
    private readonly ids: IdService,
  ) {}

  async execute(ctx: UseCaseCtx, input: ConfirmUploadInput): Promise<KnowledgeSourceView> {
    const { userId, workspaceId } = authorize(
      ctx,
      PermissionResource.KnowledgeBases,
      PermissionAction.Edit,
    );
    const parsed = parseKnowledgeInput(confirmUploadInputSchema, input);
    const documentId = this.ids.fromPublic(IdPrefix.KnowledgeDocument, parsed.documentId);
    const ticketEntry = knowledgeUploadTicketEntry(workspaceId, documentId);
    const ticket = await this.cache.get(ticketEntry);

    if (ticket === null) {
      const confirmed = await this.cache.get(
        knowledgeUploadConfirmedEntry(workspaceId, documentId),
      );
      if (confirmed === null) {
        throw new KnowledgeUploadInvalidError();
      }
      const source = await this.existingSource(workspaceId, documentId);
      if (source === null || source.id !== confirmed.sourceId) {
        throw new KnowledgeUploadInvalidError();
      }
      return this.views.view(source);
    }
    if (
      ticket.workspaceId !== workspaceId ||
      ticket.userId !== userId ||
      ticket.documentId !== documentId
    ) {
      throw new KnowledgeUploadInvalidError();
    }
    if (ticket.sourceId === null) {
      const existing = await this.existingSource(workspaceId, documentId);
      if (existing !== null) {
        await this.rememberConfirmed(workspaceId, documentId, existing.id);
        await this.forgetTicket(workspaceId, documentId);
        return this.views.view(existing);
      }
    } else {
      await this.assertReplaceable(workspaceId, ticket);
    }

    const uploadKey = knowledgeUploadStorageKey(workspaceId, documentId, ticket.fileName);
    const originalKey = knowledgeOriginalStorageKey(workspaceId, documentId, ticket.fileName);
    const stored = await this.storage.head(uploadKey);
    if (stored === null) {
      await this.discardUpload(workspaceId, documentId, uploadKey);
      throw new KnowledgeUploadInvalidError();
    }
    if (
      stored.size <= 0 ||
      stored.size > KNOWLEDGE_DOCUMENT_MAX_BYTES ||
      stored.size > ticket.sizeBytes ||
      normalizeUploadMimeType(stored.contentType ?? '') !== ticket.mimeType
    ) {
      await this.discardUpload(workspaceId, documentId, uploadKey);
      throw new KnowledgeUploadInvalidError();
    }
    try {
      await this.storage.copy(uploadKey, originalKey);
    } catch (error) {
      throw new UpstreamError('storage', { retryable: true, cause: error });
    }

    const source = await this.tenants.run(workspaceId, async () => {
      const saved =
        ticket.sourceId === null
          ? await this.createSource(ctx, ticket, documentId, originalKey, stored.size)
          : await this.replaceSource(ctx, ticket, documentId, originalKey, stored.size);
      await this.syncRuns.insert({
        id: this.ids.generate(),
        workspaceId,
        sourceId: saved.id,
        trigger:
          ticket.sourceId === null ? KnowledgeSyncTrigger.Initial : KnowledgeSyncTrigger.Manual,
        status: KnowledgeSyncStatus.Queued,
        documentsTotal: 1,
      });
      await this.jobs.enqueue(
        ctx,
        ingestKnowledgeSourceJob,
        { sourceId: saved.id },
        { durable: true },
      );
      return saved;
    });
    await this.storage.delete(uploadKey).catch((error: unknown) => {
      this.logger.warn({ msg: KNOWLEDGE_UPLOAD_CLEANUP_FAILED_MESSAGE, err: error });
    });
    await this.rememberConfirmed(workspaceId, documentId, source.id);
    await this.forgetTicket(workspaceId, documentId);
    return this.views.view(source);
  }

  private async existingSource(workspaceId: string, documentId: string): Promise<Source | null> {
    const document = await this.tenants.run(workspaceId, () =>
      this.documents.findById(workspaceId, documentId),
    );
    if (document === null) {
      return null;
    }
    return this.tenants.run(workspaceId, () =>
      this.sources.findById(workspaceId, document.sourceId),
    );
  }

  private async assertReplaceable(
    workspaceId: string,
    ticket: KnowledgeUploadTicket,
  ): Promise<void> {
    const sourceId = ticket.sourceId;
    if (sourceId === null) {
      return;
    }
    const source = await this.tenants.run(workspaceId, () =>
      this.sources.findById(workspaceId, sourceId),
    );
    if (
      source === null ||
      source.kbId !== ticket.knowledgeBaseId ||
      source.kind !== KnowledgeSourceKind.Upload ||
      source.status === KnowledgeSourceStatus.Indexing
    ) {
      throw new KnowledgeUploadInvalidError();
    }
  }

  private async createSource(
    ctx: UseCaseCtx,
    ticket: KnowledgeUploadTicket,
    documentId: string,
    originalKey: string,
    sizeBytes: number,
  ): Promise<Source> {
    const workspaceId = ctx.workspaceId;
    if (workspaceId === null) {
      throw new KnowledgeUploadInvalidError();
    }
    const source = await this.sources.insert({
      id: this.ids.generate(),
      workspaceId,
      kbId: ticket.knowledgeBaseId,
      kind: KnowledgeSourceKind.Upload,
      title: uploadTitle(ticket.fileName),
      status: KnowledgeSourceStatus.Pending,
      createdByUserId: ticket.userId,
    });
    await this.documents.insert({
      id: documentId,
      workspaceId,
      kbId: ticket.knowledgeBaseId,
      sourceId: source.id,
      title: uploadTitle(ticket.fileName),
      mimeType: ticket.mimeType,
      sizeBytes,
      originalStorageKey: originalKey,
      status: KnowledgeDocumentStatus.Pending,
    });
    return source;
  }

  private async replaceSource(
    ctx: UseCaseCtx,
    ticket: KnowledgeUploadTicket,
    documentId: string,
    originalKey: string,
    sizeBytes: number,
  ): Promise<Source> {
    const workspaceId = ctx.workspaceId;
    if (workspaceId === null || ticket.sourceId === null) {
      throw new KnowledgeUploadInvalidError();
    }
    const source = await this.sources.findById(workspaceId, ticket.sourceId);
    const document = await this.documents.findById(workspaceId, documentId);
    if (
      source === null ||
      document === null ||
      document.sourceId !== source.id ||
      source.kbId !== ticket.knowledgeBaseId
    ) {
      throw new KnowledgeUploadInvalidError();
    }
    const updatedSource = await this.sources.update(workspaceId, source.id, {
      title: uploadTitle(ticket.fileName),
      status: KnowledgeSourceStatus.Pending,
      lastErrorCode: null,
      lastErrorMessage: null,
    });
    await this.documents.update(workspaceId, documentId, {
      title: uploadTitle(ticket.fileName),
      mimeType: ticket.mimeType,
      sizeBytes,
      originalStorageKey: originalKey,
      status: KnowledgeDocumentStatus.Pending,
      errorCode: null,
      errorMessage: null,
    });
    if (updatedSource === null) {
      throw new KnowledgeUploadInvalidError();
    }
    return updatedSource;
  }

  private async rememberConfirmed(
    workspaceId: string,
    documentId: string,
    sourceId: string,
  ): Promise<void> {
    try {
      await this.cache.set(knowledgeUploadConfirmedEntry(workspaceId, documentId), { sourceId });
    } catch (error) {
      this.logger.warn({ msg: KNOWLEDGE_UPLOAD_MARKER_FAILED_MESSAGE, err: error });
    }
  }

  private async forgetTicket(workspaceId: string, documentId: string): Promise<void> {
    await this.cache
      .delete(knowledgeUploadTicketEntry(workspaceId, documentId))
      .catch((error: unknown) => {
        this.logger.warn({ msg: KNOWLEDGE_UPLOAD_TICKET_DELETE_FAILED_MESSAGE, err: error });
      });
  }

  private async discardUpload(
    workspaceId: string,
    documentId: string,
    uploadKey: string,
  ): Promise<void> {
    await this.storage.delete(uploadKey).catch((error: unknown) => {
      this.logger.warn({ msg: KNOWLEDGE_UPLOAD_CLEANUP_FAILED_MESSAGE, err: error });
    });
    await this.forgetTicket(workspaceId, documentId);
  }
}
