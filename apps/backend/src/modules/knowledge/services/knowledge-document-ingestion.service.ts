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
  KnowledgeDocumentStatus,
  KnowledgeSummarySource,
} from '@/modules/knowledge/constants/knowledge.constants';
import { DocumentParseError } from '@/modules/knowledge/errors/document-parse.error';
import {
  GoogleDriveExportTooLargeError,
  GoogleDriveFileUnavailableError,
} from '@/modules/knowledge/errors/google-drive.error';
import { bm25TermFrequencies } from '@/modules/knowledge/helpers/bm25.helpers';
import { buildIndexedChunks } from '@/modules/knowledge/helpers/chunk-index.helpers';
import { buildDocumentChunks } from '@/modules/knowledge/helpers/chunking.helpers';
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
    const { workspaceId, knowledgeBase, document } = input;
    const original = await this.loadOriginal(input);
    const parsed = await this.parser.parse({
      bytes: original.bytes,
      fileName: original.fileName,
      mimeType: original.mimeType,
      title: document.title,
    });
    const sections = buildDocumentSections(parsed.markdown);
    const unchanged =
      document.contentHash === parsed.contentHash &&
      document.activeGeneration > 0 &&
      document.contentStorageKey !== null;
    const summary = await this.summaryFor(document, parsed, sections, unchanged);
    if (unchanged && summary === null) {
      await this.adoptPendingOriginal(workspaceId, document, original.storageKey);
      return { skipped: true };
    }

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
    return { skipped: false };
  }

  private async loadOriginal(input: DocumentIngestionInput): Promise<DocumentOriginalContent> {
    const { workspaceId, document, connection } = input;
    const storedKey = document.pendingOriginalStorageKey ?? document.originalStorageKey;
    if (storedKey !== null) {
      const stored = await this.storage.head(storedKey);
      if (stored === null) {
        throw DocumentParseError.unreadable(new Error(KNOWLEDGE_DOCUMENT_ORIGINAL_MISSING_MESSAGE));
      }
      if (stored.size > KNOWLEDGE_DOCUMENT_MAX_BYTES) {
        throw new DocumentParseError(DocumentParseErrorCode.TooLarge);
      }
      return {
        storageKey: storedKey,
        fileName: basename(storedKey),
        mimeType: document.mimeType,
        bytes: await readStream(await this.storage.get(storedKey)),
        googleFile: null,
      };
    }
    if (connection === null || document.externalId === null) {
      throw DocumentParseError.unreadable(new Error(KNOWLEDGE_DOCUMENT_ORIGINAL_MISSING_MESSAGE));
    }
    try {
      const content = await this.googleDocs.export({ workspaceId, document, connection });
      return {
        storageKey: content.storageKey,
        fileName: content.fileName,
        mimeType: content.mimeType,
        bytes: content.bytes,
        googleFile: content.file,
      };
    } catch (error) {
      if (error instanceof GoogleDriveFileUnavailableError) {
        throw DocumentParseError.unreadable(error);
      }
      if (error instanceof GoogleDriveExportTooLargeError) {
        throw new DocumentParseError(DocumentParseErrorCode.TooLarge);
      }
      throw error;
    }
  }

  private async summaryFor(
    document: DocumentIngestionInput['document'],
    parsed: ParsedDocument,
    sections: ReturnType<typeof buildDocumentSections>,
    unchanged: boolean,
  ): Promise<DocumentSummaryResult | null> {
    const hasSummary = (document.summary?.trim() ?? '').length > 0;
    if (unchanged && hasSummary) {
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
