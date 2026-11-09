import { Injectable } from '@nestjs/common';
import { KNOWLEDGE_DOCUMENT_UPDATE_MISSING_MESSAGE } from '@/modules/knowledge/constants/knowledge-error.constants';
import { KnowledgeDocumentStatus } from '@/modules/knowledge/constants/knowledge.constants';
import { KnowledgeDocumentNotFoundError } from '@/modules/knowledge/errors/knowledge-document-not-found.error';
import { bm25TermFrequencies } from '@/modules/knowledge/helpers/bm25.helpers';
import { buildIndexedChunks } from '@/modules/knowledge/helpers/chunk-index.helpers';
import { knowledgeEmbeddingModel } from '@/modules/knowledge/helpers/knowledge-embedding.helpers';
import { ChunkTermsRepository } from '@/modules/knowledge/repositories/chunk-terms.repository';
import { ChunksRepository } from '@/modules/knowledge/repositories/chunks.repository';
import { DocumentsRepository } from '@/modules/knowledge/repositories/documents.repository';
import { KnowledgeBasesRepository } from '@/modules/knowledge/repositories/knowledge-bases.repository';
import { SectionsRepository } from '@/modules/knowledge/repositories/sections.repository';
import { KnowledgeEmbeddingService } from '@/modules/knowledge/services/knowledge-embedding.service';
import type { NewChunkTerm } from '@/modules/knowledge/typedefs/chunk-term.typedefs';
import type { NewChunk } from '@/modules/knowledge/typedefs/chunk.typedefs';
import type {
  LoadedKnowledgeDocument,
  ReindexKnowledgeDocumentInput,
} from '@/modules/knowledge/typedefs/knowledge-reindex.typedefs';
import type { NewSection } from '@/modules/knowledge/typedefs/section.typedefs';
import { ClockService } from '@/platform/clock/services/clock.service';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { IdService } from '@/platform/ids/services/id.service';

@Injectable()
export class KnowledgeDocumentReindexService {
  constructor(
    private readonly tenants: TenantTransactionService,
    private readonly documents: DocumentsRepository,
    private readonly knowledgeBases: KnowledgeBasesRepository,
    private readonly sections: SectionsRepository,
    private readonly chunks: ChunksRepository,
    private readonly chunkTerms: ChunkTermsRepository,
    private readonly embeddings: KnowledgeEmbeddingService,
    private readonly clock: ClockService,
    private readonly ids: IdService,
  ) {}

  async reindex(input: ReindexKnowledgeDocumentInput): Promise<void> {
    const loaded = await this.load(input);
    if (loaded === null) {
      return;
    }
    const { document, knowledgeBase, sections, chunks } = loaded;
    const sectionOrdinals = new Map(sections.map((section) => [section.id, section.ordinal]));
    const chunkInputs = chunks.map((chunk) => {
      const sectionOrdinal = sectionOrdinals.get(chunk.sectionId);
      if (sectionOrdinal === undefined) {
        throw new Error(KNOWLEDGE_DOCUMENT_UPDATE_MISSING_MESSAGE);
      }
      return {
        sectionOrdinal,
        ordinal: chunk.ordinal,
        content: chunk.content,
        tokenCount: chunk.tokenCount,
      };
    });
    const indexed = buildIndexedChunks({
      title: document.title,
      summary: document.summary,
      sections,
      chunks: chunkInputs,
    });
    const embeddingModel = knowledgeEmbeddingModel(knowledgeBase.embeddingModel);
    const embedded = await this.embeddings.embed({
      workspaceId: input.workspaceId,
      model: embeddingModel,
      dimensions: knowledgeBase.embeddingDimensions,
      chunks: indexed,
    });
    const generation = document.activeGeneration + 1;
    const now = this.clock.now();
    const sectionIds = new Map(sections.map((section) => [section.ordinal, this.ids.generate()]));
    const sectionRows = sections.map((section): NewSection => {
      const id = sectionIds.get(section.ordinal);
      if (id === undefined) {
        throw new Error(KNOWLEDGE_DOCUMENT_UPDATE_MISSING_MESSAGE);
      }
      return {
        id,
        workspaceId: input.workspaceId,
        kbId: document.kbId,
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
        workspaceId: input.workspaceId,
        kbId: document.kbId,
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
        termRows.push({
          workspaceId: input.workspaceId,
          kbId: document.kbId,
          chunkId,
          term,
          frequency,
        });
      }
    });

    await this.tenants.run(input.workspaceId, async () => {
      const current = await this.documents.findByIdForUpdate(input.workspaceId, document.id);
      if (
        current === null ||
        current.activeGeneration !== document.activeGeneration ||
        current.status !== KnowledgeDocumentStatus.Indexing
      ) {
        return;
      }
      await this.sections.deleteByDocumentGeneration(input.workspaceId, document.id, generation);
      await this.sections.insertMany(sectionRows);
      await this.chunks.insertMany(chunkRows);
      await this.chunkTerms.insertMany(termRows);
      const updated = await this.documents.update(input.workspaceId, document.id, {
        activeGeneration: generation,
        chunkCount: embedded.chunks.length,
        status: KnowledgeDocumentStatus.Indexed,
        lastIndexedAt: now,
        errorCode: null,
        errorMessage: null,
      });
      if (updated === null) {
        throw new Error(KNOWLEDGE_DOCUMENT_UPDATE_MISSING_MESSAGE);
      }
      await this.sections.deleteByDocumentGeneration(
        input.workspaceId,
        document.id,
        document.activeGeneration,
      );
    });
  }

  private async load(
    input: ReindexKnowledgeDocumentInput,
  ): Promise<LoadedKnowledgeDocument | null> {
    return this.tenants.run(input.workspaceId, async () => {
      const document = await this.documents.findByIdForUpdate(input.workspaceId, input.documentId);
      if (document === null) {
        throw new KnowledgeDocumentNotFoundError();
      }
      if (document.status !== KnowledgeDocumentStatus.Indexing || document.activeGeneration <= 0) {
        return null;
      }
      const knowledgeBase = await this.knowledgeBases.findById(input.workspaceId, document.kbId);
      if (knowledgeBase === null) {
        throw new Error(KNOWLEDGE_DOCUMENT_UPDATE_MISSING_MESSAGE);
      }
      const sections = await this.sections.listByDocumentGeneration(
        input.workspaceId,
        document.id,
        document.activeGeneration,
      );
      const chunks = await this.chunks.listByDocumentGeneration(
        input.workspaceId,
        document.id,
        document.activeGeneration,
      );
      if (sections.length === 0 || chunks.length === 0) {
        throw new Error(KNOWLEDGE_DOCUMENT_UPDATE_MISSING_MESSAGE);
      }
      return { document, knowledgeBase, sections, chunks };
    });
  }
}
