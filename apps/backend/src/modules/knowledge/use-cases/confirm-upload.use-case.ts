import {
  IdPrefix,
  KNOWLEDGE_DOCUMENT_MAX_BYTES,
  PermissionAction,
  PermissionResource,
} from '@agent-ic/contracts';
import { Injectable, Logger } from '@nestjs/common';
import { knowledgeUploadTicketEntry } from '@/modules/knowledge/constants/knowledge-upload-cache.constants';
import {
  KNOWLEDGE_UPLOAD_CLEANUP_FAILED_MESSAGE,
  KNOWLEDGE_UPLOAD_STORAGE_FAILED_MESSAGE,
  KNOWLEDGE_UPLOAD_TICKET_DELETE_FAILED_MESSAGE,
} from '@/modules/knowledge/constants/knowledge-upload.constants';
import {
  KnowledgeDocumentStatus,
  KnowledgeSourceKind,
  KnowledgeSourceStatus,
  KnowledgeSyncStatus,
  KnowledgeSyncTrigger,
} from '@/modules/knowledge/constants/knowledge.constants';
import { KnowledgeBaseNotFoundError } from '@/modules/knowledge/errors/knowledge-base-not-found.error';
import { KnowledgeUploadInvalidError } from '@/modules/knowledge/errors/knowledge-upload-invalid.error';
import { normalizeDocumentMimeType } from '@/modules/knowledge/helpers/document-format.helpers';
import { parseKnowledgeInput } from '@/modules/knowledge/helpers/knowledge-input.helpers';
import {
  knowledgeOriginalStorageKey,
  knowledgeUploadStorageKey,
} from '@/modules/knowledge/helpers/knowledge-storage.helpers';
import { uploadTitle } from '@/modules/knowledge/helpers/knowledge-upload.helpers';
import { ingestKnowledgeSourceJob } from '@/modules/knowledge/jobs/ingest-knowledge-source.job';
import { DocumentsRepository } from '@/modules/knowledge/repositories/documents.repository';
import { KnowledgeBasesRepository } from '@/modules/knowledge/repositories/knowledge-bases.repository';
import { SourcesRepository } from '@/modules/knowledge/repositories/sources.repository';
import { SyncRunsRepository } from '@/modules/knowledge/repositories/sync-runs.repository';
import { confirmUploadInputSchema } from '@/modules/knowledge/schemas/knowledge-input.schema';
import { KnowledgeSourceViewsService } from '@/modules/knowledge/services/knowledge-source-views.service';
import { KnowledgeUploadTargetsService } from '@/modules/knowledge/services/knowledge-upload-targets.service';
import type {
  ConfirmedKnowledgeUpload,
  ConfirmUploadInput,
  KnowledgeUploadTarget,
  KnowledgeUploadTicket,
} from '@/modules/knowledge/typedefs/knowledge-upload.typedefs';
import type { KnowledgeSourceView } from '@/modules/knowledge/typedefs/source.typedefs';
import { CacheService } from '@/platform/cache/services/cache.service';
import { authorize } from '@/platform/context/helpers/authorize.helpers';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { IdService } from '@/platform/ids/services/id.service';
import { JobsService } from '@/platform/queues/services/jobs.service';
import { FileStorage } from '@/platform/storage/gateways/file-storage.gateway';

@Injectable()
export class ConfirmUploadUseCase {
  private readonly logger = new Logger(ConfirmUploadUseCase.name);

  constructor(
    private readonly tenants: TenantTransactionService,
    private readonly knowledgeBases: KnowledgeBasesRepository,
    private readonly targets: KnowledgeUploadTargetsService,
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
      const existing = await this.findConfirmed(workspaceId, documentId);
      if (existing === null) {
        throw new KnowledgeUploadInvalidError();
      }
      return this.views.view(existing.source);
    }
    if (
      ticket.workspaceId !== workspaceId ||
      ticket.userId !== userId ||
      ticket.documentId !== documentId
    ) {
      throw new KnowledgeUploadInvalidError();
    }
    const ticketSourceId = ticket.sourceId;
    if (ticketSourceId === null) {
      const existing = await this.findConfirmed(workspaceId, documentId);
      if (existing !== null) {
        await this.forgetTicket(workspaceId, documentId);
        return this.views.view(existing.source);
      }
    } else {
      await this.tenants.run(workspaceId, () =>
        this.targets.findReplaceTarget(workspaceId, ticketSourceId, ticket.knowledgeBaseId, {
          lock: false,
        }),
      );
    }

    const uploadKey = knowledgeUploadStorageKey(
      workspaceId,
      documentId,
      ticket.uploadId,
      ticket.fileName,
    );
    const syncRunId = this.ids.generate();
    const originalKey = knowledgeOriginalStorageKey(
      workspaceId,
      documentId,
      syncRunId,
      ticket.fileName,
    );
    const stored = await this.storage.head(uploadKey);
    if (stored === null) {
      await this.discardUpload(workspaceId, documentId, uploadKey);
      throw new KnowledgeUploadInvalidError();
    }
    if (
      stored.size <= 0 ||
      stored.size > KNOWLEDGE_DOCUMENT_MAX_BYTES ||
      stored.size > ticket.sizeBytes ||
      normalizeDocumentMimeType(stored.contentType ?? '') !== ticket.mimeType
    ) {
      await this.discardUpload(workspaceId, documentId, uploadKey);
      throw new KnowledgeUploadInvalidError();
    }
    await this.storage.copy(uploadKey, originalKey);

    let confirmed: ConfirmedKnowledgeUpload;
    try {
      confirmed = await this.tenants.run(workspaceId, async () => {
        const knowledgeBase = await this.knowledgeBases.findByIdForUpdate(
          workspaceId,
          ticket.knowledgeBaseId,
        );
        if (knowledgeBase === null) {
          throw new KnowledgeBaseNotFoundError();
        }
        if (ticket.sourceId === null) {
          return this.createSource(
            workspaceId,
            ctx,
            ticket,
            documentId,
            originalKey,
            stored.size,
            syncRunId,
          );
        }
        const target = await this.targets.findReplaceTarget(
          workspaceId,
          ticket.sourceId,
          knowledgeBase.id,
          { lock: true },
        );
        return this.replaceSource(
          workspaceId,
          ctx,
          ticket,
          target,
          originalKey,
          stored.size,
          syncRunId,
        );
      });
    } catch (error) {
      await this.deleteStorageKey(originalKey);
      if (
        error instanceof KnowledgeUploadInvalidError ||
        error instanceof KnowledgeBaseNotFoundError
      ) {
        await this.discardUpload(workspaceId, documentId, uploadKey);
      }
      throw error;
    }

    await this.cleanupStorageKeys(confirmed.discardedStorageKeys);
    await this.deleteStorageKeyIfUnused(confirmed.document, originalKey);
    await this.storage.delete(uploadKey).catch((error: unknown) => {
      this.logger.warn({ msg: KNOWLEDGE_UPLOAD_CLEANUP_FAILED_MESSAGE, err: error });
    });
    await this.forgetTicket(workspaceId, documentId);
    return this.views.view(confirmed.source);
  }

  private async findConfirmed(
    workspaceId: string,
    documentId: string,
  ): Promise<KnowledgeUploadTarget | null> {
    return this.tenants.run(workspaceId, () =>
      this.findConfirmedInTransaction(workspaceId, documentId),
    );
  }

  private async findConfirmedInTransaction(
    workspaceId: string,
    documentId: string,
  ): Promise<KnowledgeUploadTarget | null> {
    const document = await this.documents.findById(workspaceId, documentId);
    if (document === null) {
      return null;
    }
    const source = await this.sources.findById(workspaceId, document.sourceId);
    return source === null || source.kind !== KnowledgeSourceKind.Upload
      ? null
      : { source, document };
  }

  private async createSource(
    workspaceId: string,
    ctx: UseCaseCtx,
    ticket: KnowledgeUploadTicket,
    documentId: string,
    originalKey: string,
    sizeBytes: number,
    syncRunId: string,
  ): Promise<ConfirmedKnowledgeUpload> {
    const title = uploadTitle(ticket.fileName);
    const source = await this.sources.insert({
      id: this.ids.generate(),
      workspaceId,
      kbId: ticket.knowledgeBaseId,
      kind: KnowledgeSourceKind.Upload,
      title,
      status: KnowledgeSourceStatus.Pending,
      createdByUserId: ticket.userId,
    });
    const document = await this.documents.insertIfAbsent({
      id: documentId,
      workspaceId,
      kbId: ticket.knowledgeBaseId,
      sourceId: source.id,
      title,
      mimeType: ticket.mimeType,
      sizeBytes,
      originalStorageKey: originalKey,
      status: KnowledgeDocumentStatus.Pending,
    });
    if (document === null) {
      await this.sources.deleteById(workspaceId, source.id);
      const existing = await this.findConfirmedInTransaction(workspaceId, documentId);
      if (existing === null) {
        throw new KnowledgeUploadInvalidError();
      }
      return { ...existing, discardedStorageKeys: [] };
    }
    await this.enqueueIngestion(
      workspaceId,
      ctx,
      source.id,
      syncRunId,
      KnowledgeSyncTrigger.Initial,
    );
    return { source, document, discardedStorageKeys: [] };
  }

  private async replaceSource(
    workspaceId: string,
    ctx: UseCaseCtx,
    ticket: KnowledgeUploadTicket,
    target: KnowledgeUploadTarget,
    originalKey: string,
    sizeBytes: number,
    syncRunId: string,
  ): Promise<ConfirmedKnowledgeUpload> {
    if (ticket.sourceId === null) {
      throw new KnowledgeUploadInvalidError();
    }
    const title = uploadTitle(ticket.fileName);
    const source = await this.sources.update(workspaceId, target.source.id, {
      title,
      status: KnowledgeSourceStatus.Pending,
      lastErrorCode: null,
      lastErrorMessage: null,
    });
    const document = await this.documents.update(workspaceId, target.document.id, {
      title,
      mimeType: ticket.mimeType,
      sizeBytes,
      pendingOriginalStorageKey: originalKey,
      contentHash: null,
      status: KnowledgeDocumentStatus.Pending,
      warnings: [],
      errorCode: null,
      errorMessage: null,
    });
    if (source === null || document === null) {
      throw new KnowledgeUploadInvalidError();
    }
    await this.enqueueIngestion(
      workspaceId,
      ctx,
      source.id,
      syncRunId,
      KnowledgeSyncTrigger.Manual,
    );
    const previousPending = target.document.pendingOriginalStorageKey;
    return {
      source,
      document,
      discardedStorageKeys:
        previousPending === null ||
        previousPending === originalKey ||
        previousPending === target.document.originalStorageKey
          ? []
          : [previousPending],
    };
  }

  private async enqueueIngestion(
    workspaceId: string,
    ctx: UseCaseCtx,
    sourceId: string,
    syncRunId: string,
    trigger: KnowledgeSyncTrigger,
  ): Promise<void> {
    await this.syncRuns.insert({
      id: syncRunId,
      workspaceId,
      sourceId,
      trigger,
      status: KnowledgeSyncStatus.Queued,
      documentsTotal: 1,
    });
    await this.jobs.enqueue(
      ctx,
      ingestKnowledgeSourceJob,
      { sourceId, syncRunId },
      { durable: true, jobId: syncRunId },
    );
  }

  private async deleteStorageKeyIfUnused(
    document: KnowledgeUploadTarget['document'],
    key: string,
  ): Promise<void> {
    if (document.originalStorageKey === key || document.pendingOriginalStorageKey === key) {
      return;
    }
    await this.deleteStorageKey(key);
  }

  private async cleanupStorageKeys(keys: readonly string[]): Promise<void> {
    for (const key of keys) {
      await this.deleteStorageKey(key);
    }
  }

  private async deleteStorageKey(key: string): Promise<void> {
    await this.storage.delete(key).catch((error: unknown) => {
      this.logger.warn({ msg: KNOWLEDGE_UPLOAD_STORAGE_FAILED_MESSAGE, err: error });
    });
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
