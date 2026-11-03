import { basename } from 'node:path';
import { KNOWLEDGE_DOCUMENT_MAX_BYTES } from '@agent-ic/contracts';
import { Injectable, Logger } from '@nestjs/common';
import { DocumentParseErrorCode } from '@/modules/knowledge/constants/document-parser.constants';
import {
  KNOWLEDGE_DOCUMENT_ORIGINAL_MISSING_MESSAGE,
  KNOWLEDGE_DOCUMENT_UPDATE_MISSING_MESSAGE,
} from '@/modules/knowledge/constants/knowledge-error.constants';
import { KnowledgeLogMessage } from '@/modules/knowledge/constants/knowledge-log.constants';
import {
  KNOWLEDGE_CANONICAL_MARKDOWN_MIME_TYPE,
  KNOWLEDGE_STORAGE_DELETE_FAILED_MESSAGE,
} from '@/modules/knowledge/constants/knowledge-storage.constants';
import {
  KnowledgeDocumentIngestionOutcome,
  KnowledgeDocumentStatus,
  KnowledgeDocumentStaleReason,
  KnowledgeSummarySource,
} from '@/modules/knowledge/constants/knowledge.constants';
import { DocumentParseError } from '@/modules/knowledge/errors/document-parse.error';
import {
  GoogleDriveExportTooLargeError,
  GoogleDriveFileRemovedError,
  GoogleDriveFileUnavailableError,
} from '@/modules/knowledge/errors/google-drive.error';
import { bm25TermFrequencies } from '@/modules/knowledge/helpers/bm25.helpers';
import { buildIndexedChunks } from '@/modules/knowledge/helpers/chunk-index.helpers';
import { buildDocumentChunks } from '@/modules/knowledge/helpers/chunking.helpers';
import { googleDocsProviderUnchanged } from '@/modules/knowledge/helpers/google-docs.helpers';
import { googleDriveDate } from '@/modules/knowledge/helpers/google-picker.helpers';
import { knowledgeEmbeddingModel } from '@/modules/knowledge/helpers/knowledge-embedding.helpers';
import { knowledgeContentStorageKey } from '@/modules/knowledge/helpers/knowledge-storage.helpers';
import { buildDocumentSections } from '@/modules/knowledge/helpers/section-tree.helpers';
import { ChunkTermsRepository } from '@/modules/knowledge/repositories/chunk-terms.repository';
import { ChunksRepository } from '@/modules/knowledge/repositories/chunks.repository';
import { DocumentsRepository } from '@/modules/knowledge/repositories/documents.repository';
import { SectionsRepository } from '@/modules/knowledge/repositories/sections.repository';
import { DocumentParserService } from '@/modules/knowledge/services/document-parser.service';
import { DocumentSummaryService } from '@/modules/knowledge/services/document-summary.service';
import { GoogleDocsContentService } from '@/modules/knowledge/services/google-docs-content.service';
import { KnowledgeEmbeddingService } from '@/modules/knowledge/services/knowledge-embedding.service';
import type { NewChunkTerm } from '@/modules/knowledge/typedefs/chunk-term.typedefs';
import type { NewChunk } from '@/modules/knowledge/typedefs/chunk.typedefs';
import type { ParsedDocument } from '@/modules/knowledge/typedefs/document-parser.typedefs';
import type { DocumentSummaryResult } from '@/modules/knowledge/typedefs/document-summary.typedefs';
import type { KnowledgeDocumentWarning } from '@/modules/knowledge/typedefs/document-warning.typedefs';
import type { GoogleDocsFileSnapshot } from '@/modules/knowledge/typedefs/google-docs-content.typedefs';
import type {
  DocumentIngestionInput,
  DocumentIngestionResult,
  DocumentOriginalContent,
} from '@/modules/knowledge/typedefs/knowledge-ingestion.typedefs';
import type { NewSection } from '@/modules/knowledge/typedefs/section.typedefs';
import { ClockService } from '@/platform/clock/services/clock.service';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { IdService } from '@/platform/ids/services/id.service';
import { FileStorage } from '@/platform/storage/gateways/file-storage.gateway';
import { readStream } from '@/platform/storage/helpers/stream.helpers';

@Injectable()
export class KnowledgeDocumentIngestionService {
  private readonly logger = new Logger(KnowledgeDocumentIngestionService.name);

  constructor(
    private readonly tenants: TenantTransactionService,
    private readonly storage: FileStorage,
    private readonly parser: DocumentParserService,
    private readonly summary: DocumentSummaryService,
    private readonly googleDocs: GoogleDocsContentService,
    private readonly embeddings: KnowledgeEmbeddingService,
    private readonly documents: DocumentsRepository,
    private readonly sections: SectionsRepository,
    private readonly chunks: ChunksRepository,
    private readonly chunkTerms: ChunkTermsRepository,
    private readonly clock: ClockService,
    private readonly ids: IdService,
  ) {}

  async ingest(input: DocumentIngestionInput): Promise<DocumentIngestionResult> {
    try {
      return await this.ingestDocument(input);
    } catch (error) {
      if (error instanceof GoogleDriveFileRemovedError) {
        return this.markStale(input, error.staleReason);
      }
      throw error;
    }
  }

  private async ingestDocument(input: DocumentIngestionInput): Promise<DocumentIngestionResult> {
    const { workspaceId, knowledgeBase } = input;
    let document = input.document;
    const googleSnapshot = await this.loadGoogleDocsSnapshot(input);
    if (googleSnapshot !== null && document.staleAt !== null) {
      document = (await this.clearStale(workspaceId, document)) ?? document;
    }
    const providerUnchanged =
      googleSnapshot !== null && googleDocsProviderUnchanged(document, googleSnapshot.file);
    if (
      providerUnchanged &&
      document.status === KnowledgeDocumentStatus.Indexed &&
      this.hasSummary(document)
    ) {
      return { outcome: KnowledgeDocumentIngestionOutcome.Skipped };
    }
    const original = await this.loadOriginal(input, googleSnapshot, providerUnchanged);
    const parsed = await this.parser.parse({
      bytes: original.bytes,
      fileName: original.fileName,
      mimeType: original.mimeType,
      title: document.title,
    });
    const sections = buildDocumentSections(parsed.markdown);
    const unchanged =
      (document.externalId === null || document.status === KnowledgeDocumentStatus.Indexed) &&
      document.contentHash === parsed.contentHash &&
      document.activeGeneration > 0 &&
      document.contentStorageKey !== null;
    const summary = await this.summaryFor(document, parsed, sections, unchanged);
    if (unchanged && summary === null) {
      await this.adoptSkippedOriginal(workspaceId, document, original);
      return { outcome: KnowledgeDocumentIngestionOutcome.Skipped };
    }

    await input.onIndexing();
    const chunks = buildDocumentChunks(sections);
    const indexedChunks = buildIndexedChunks({
      title: parsed.title,
      summary: summary?.summary ?? null,
      sections,
      chunks,
    });
    const embeddingModel = knowledgeEmbeddingModel(knowledgeBase.embeddingModel);
    const embedded = await this.embeddings.embed({
      workspaceId,
      model: embeddingModel,
      dimensions: knowledgeBase.embeddingDimensions,
      chunks: indexedChunks,
    });
    const generation = document.activeGeneration + 1;
    const contentStorageKey = knowledgeContentStorageKey(workspaceId, document.id, generation);
    await this.storage.put(
      contentStorageKey,
      Buffer.from(parsed.markdown),
      KNOWLEDGE_CANONICAL_MARKDOWN_MIME_TYPE,
    );

    const now = this.clock.now();
    const sectionIds = new Map(sections.map((section) => [section.ordinal, this.ids.generate()]));
    const sectionRows = sections.map((section): NewSection => {
      const id = sectionIds.get(section.ordinal);
      if (id === undefined) {
        throw new Error(KNOWLEDGE_DOCUMENT_UPDATE_MISSING_MESSAGE);
      }
      return {
        id,
        workspaceId,
        kbId: knowledgeBase.id,
        documentId: document.id,
        generation,
        ordinal: section.ordinal,
        level: section.level,
        path: section.path,
        heading: section.heading,
        content: section.content,
        tokenCount: section.tokenCount,
        contentHash: section.contentHash,
      };
    });
    const chunkIds = embedded.chunks.map(() => this.ids.generate());
    const chunkRows = embedded.chunks.map((chunk, index): NewChunk => {
      const id = chunkIds[index];
      const sectionId = sectionIds.get(chunk.sectionOrdinal);
      if (id === undefined || sectionId === undefined) {
        throw new Error(KNOWLEDGE_DOCUMENT_UPDATE_MISSING_MESSAGE);
      }
      return {
        id,
        workspaceId,
        kbId: knowledgeBase.id,
        documentId: document.id,
        sectionId,
        generation,
        ordinal: chunk.ordinal,
        content: chunk.content,
        indexText: chunk.indexText,
        contentHash: chunk.contentHash,
        tokenCount: chunk.tokenCount,
        embedding: [...chunk.embedding],
        embeddingModel: chunk.embeddingModel,
        embeddingDimensions: chunk.embeddingDimensions,
      };
    });
    const termRows: NewChunkTerm[] = [];
    embedded.chunks.forEach((chunk, index) => {
      const chunkId = chunkIds[index];
      if (chunkId === undefined) {
        throw new Error(KNOWLEDGE_DOCUMENT_UPDATE_MISSING_MESSAGE);
      }
      for (const [term, frequency] of bm25TermFrequencies(chunk.indexText)) {
        termRows.push({ workspaceId, kbId: knowledgeBase.id, chunkId, term, frequency });
      }
    });

    await this.tenants.run(workspaceId, async () => {
      await this.sections.deleteByDocumentGeneration(workspaceId, document.id, generation);
      await this.sections.insertMany(sectionRows);
      await this.chunks.insertMany(chunkRows);
      await this.chunkTerms.insertMany(termRows);
      const updated = await this.documents.update(workspaceId, document.id, {
        title: parsed.title,
        originalStorageKey: original.storageKey,
        pendingOriginalStorageKey: null,
        sizeBytes: original.bytes.length,
        contentStorageKey,
        contentHash: parsed.contentHash,
        warnings: this.warnings(parsed, summary),
        tokenCount: parsed.tokenCount,
        chunkCount: embedded.chunks.length,
        status: KnowledgeDocumentStatus.Indexed,
        activeGeneration: generation,
        lastIndexedAt: now,
        staleAt: null,
        staleReason: null,
        errorCode: null,
        errorMessage: null,
        ...(original.googleFile === null
          ? {}
          : {
              sourceUrl: original.googleFile.webViewLink ?? document.sourceUrl,
              providerVersion: original.googleFile.version,
              providerModifiedAt: googleDriveDate(original.googleFile.modifiedTime),
            }),
        ...(summary?.generated === true
          ? {
              summary: summary.summary,
              summarySource: KnowledgeSummarySource.Auto,
              summaryUpdatedAt: now,
            }
          : {}),
      });
      if (updated === null) {
        throw new Error(KNOWLEDGE_DOCUMENT_UPDATE_MISSING_MESSAGE);
      }
      await this.sections.deleteByDocumentGeneration(
        workspaceId,
        document.id,
        document.activeGeneration,
      );
    });

    await this.deleteObjectIfChanged(document.originalStorageKey, original.storageKey);
    await this.deleteObjectIfChanged(document.contentStorageKey, contentStorageKey);
    return { outcome: KnowledgeDocumentIngestionOutcome.Indexed };
  }

  private async markStale(
    input: DocumentIngestionInput,
    reason: KnowledgeDocumentStaleReason,
  ): Promise<DocumentIngestionResult> {
    const { workspaceId, document } = input;
    if (
      document.status !== KnowledgeDocumentStatus.Indexed ||
      document.activeGeneration <= 0 ||
      document.contentStorageKey === null
    ) {
      throw DocumentParseError.unreadable(new GoogleDriveFileRemovedError(reason));
    }
    const updated = await this.tenants.run(workspaceId, () =>
      this.documents.update(workspaceId, document.id, {
        staleAt: document.staleAt ?? this.clock.now(),
        staleReason: reason,
        errorCode: null,
        errorMessage: null,
      }),
    );
    if (updated === null) {
      throw new GoogleDriveFileRemovedError(reason);
    }
    return { outcome: KnowledgeDocumentIngestionOutcome.Stale };
  }

  private async clearStale(
    workspaceId: string,
    document: DocumentIngestionInput['document'],
  ): Promise<DocumentIngestionInput['document'] | null> {
    return this.tenants.run(workspaceId, () =>
      this.documents.update(workspaceId, document.id, {
        staleAt: null,
        staleReason: null,
      }),
    );
  }

  private async loadOriginal(
    input: DocumentIngestionInput,
    googleSnapshot: GoogleDocsFileSnapshot | null,
    providerUnchanged: boolean,
  ): Promise<DocumentOriginalContent> {
    if (input.document.externalId !== null) {
      if (googleSnapshot === null) {
        throw DocumentParseError.unreadable(new Error(KNOWLEDGE_DOCUMENT_ORIGINAL_MISSING_MESSAGE));
      }
      if (providerUnchanged && input.document.originalStorageKey !== null) {
        return this.loadStoredOriginal(input, input.document.originalStorageKey);
      }
      return this.loadGoogleDocsOriginal(input, googleSnapshot);
    }
    const storedKey = input.document.pendingOriginalStorageKey ?? input.document.originalStorageKey;
    if (storedKey !== null) {
      return this.loadStoredOriginal(input, storedKey);
    }
    throw DocumentParseError.unreadable(new Error(KNOWLEDGE_DOCUMENT_ORIGINAL_MISSING_MESSAGE));
  }

  private async loadGoogleDocsSnapshot(
    input: DocumentIngestionInput,
  ): Promise<GoogleDocsFileSnapshot | null> {
    const { workspaceId, document, connection } = input;
    if (document.externalId === null) {
      return null;
    }
    if (connection === null) {
      throw DocumentParseError.unreadable(new Error(KNOWLEDGE_DOCUMENT_ORIGINAL_MISSING_MESSAGE));
    }
    try {
      return await this.googleDocs.inspect({ workspaceId, document, connection });
    } catch (error) {
      throw this.googleDocsParseError(error);
    }
  }

  private async loadStoredOriginal(
    input: DocumentIngestionInput,
    storageKey: string,
  ): Promise<DocumentOriginalContent> {
    const stored = await this.storage.head(storageKey);
    if (stored === null) {
      throw DocumentParseError.unreadable(new Error(KNOWLEDGE_DOCUMENT_ORIGINAL_MISSING_MESSAGE));
    }
    if (stored.size > KNOWLEDGE_DOCUMENT_MAX_BYTES) {
      throw new DocumentParseError(DocumentParseErrorCode.TooLarge);
    }
    return {
      storageKey,
      fileName: basename(storageKey),
      mimeType: input.document.mimeType,
      bytes: await readStream(await this.storage.get(storageKey)),
      googleFile: null,
    };
  }

  private async loadGoogleDocsOriginal(
    input: DocumentIngestionInput,
    snapshot: GoogleDocsFileSnapshot,
  ): Promise<DocumentOriginalContent> {
    const { workspaceId, document } = input;
    try {
      const content = await this.googleDocs.export({
        workspaceId,
        document,
        snapshot,
      });
      return {
        storageKey: content.storageKey,
        fileName: content.fileName,
        mimeType: content.mimeType,
        bytes: content.bytes,
        googleFile: content.file,
      };
    } catch (error) {
      throw this.googleDocsParseError(error);
    }
  }

  private googleDocsParseError(error: unknown): unknown {
    if (error instanceof GoogleDriveFileRemovedError) {
      return error;
    }
    if (error instanceof GoogleDriveFileUnavailableError) {
      return DocumentParseError.unreadable(error);
    }
    if (error instanceof GoogleDriveExportTooLargeError) {
      return new DocumentParseError(DocumentParseErrorCode.TooLarge);
    }
    return error;
  }

  private async summaryFor(
    document: DocumentIngestionInput['document'],
    parsed: ParsedDocument,
    sections: ReturnType<typeof buildDocumentSections>,
    unchanged: boolean,
  ): Promise<DocumentSummaryResult | null> {
    if (unchanged && this.hasSummary(document)) {
      return null;
    }
    try {
      return await this.summary.generate({
        workspaceId: document.workspaceId,
        title: parsed.title,
        markdown: parsed.markdown,
        sections,
        existingSummary: document.summary,
      });
    } catch (error) {
      this.logger.warn({
        msg: KnowledgeLogMessage.SummaryFailed,
        documentId: document.id,
        err: error,
      });
      return null;
    }
  }

  private hasSummary(document: DocumentIngestionInput['document']): boolean {
    return (document.summary?.trim() ?? '').length > 0;
  }

  private async adoptSkippedOriginal(
    workspaceId: string,
    document: DocumentIngestionInput['document'],
    original: DocumentOriginalContent,
  ): Promise<void> {
    if (original.googleFile !== null) {
      const file = original.googleFile;
      const updated = await this.tenants.run(workspaceId, () =>
        this.documents.update(workspaceId, document.id, {
          originalStorageKey: original.storageKey,
          pendingOriginalStorageKey: null,
          sizeBytes: original.bytes.length,
          sourceUrl: file.webViewLink ?? document.sourceUrl,
          providerVersion: file.version,
          providerModifiedAt: googleDriveDate(file.modifiedTime),
        }),
      );
      if (updated === null) {
        return;
      }
      await this.deleteObjectIfChanged(document.originalStorageKey, original.storageKey);
      return;
    }
    await this.adoptPendingOriginal(workspaceId, document, original.storageKey);
  }

  private async adoptPendingOriginal(
    workspaceId: string,
    document: DocumentIngestionInput['document'],
    originalKey: string,
  ): Promise<void> {
    if (document.pendingOriginalStorageKey === null) {
      return;
    }
    const updated = await this.tenants.run(workspaceId, () =>
      this.documents.update(workspaceId, document.id, {
        originalStorageKey: originalKey,
        pendingOriginalStorageKey: null,
      }),
    );
    if (updated === null) {
      return;
    }
    await this.deleteObjectIfChanged(document.originalStorageKey, originalKey);
  }

  private warnings(
    parsed: ParsedDocument,
    summary: DocumentSummaryResult | null,
  ): readonly KnowledgeDocumentWarning[] {
    return [...parsed.warnings, ...(summary?.warnings ?? [])].map(({ code, message }) => ({
      code,
      message,
    }));
  }

  private async deleteObjectIfChanged(
    previousKey: string | null,
    currentKey: string,
  ): Promise<void> {
    if (previousKey === null || previousKey === currentKey) {
      return;
    }
    await this.storage.delete(previousKey).catch((error: unknown) => {
      this.logger.warn({ msg: KNOWLEDGE_STORAGE_DELETE_FAILED_MESSAGE, err: error });
    });
  }
}
