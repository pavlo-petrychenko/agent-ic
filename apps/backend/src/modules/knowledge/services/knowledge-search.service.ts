import { IdPrefix } from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import {
  KNOWLEDGE_SEARCH_BM25_LIMIT,
  KNOWLEDGE_SEARCH_NEIGHBOUR_COUNT,
  KNOWLEDGE_SEARCH_RESULT_LIMIT,
  KNOWLEDGE_SEARCH_SECTION_TOKEN_LIMIT,
  KNOWLEDGE_SEARCH_TEXT_MARGIN,
  KNOWLEDGE_SEARCH_TEXT_SEPARATOR,
  KNOWLEDGE_SEARCH_TRIGRAM_LIMIT,
  KNOWLEDGE_SEARCH_VECTOR_LIMIT,
} from '@/modules/knowledge/constants/knowledge-search.constants';
import { KnowledgeBaseNotFoundError } from '@/modules/knowledge/errors/knowledge-base-not-found.error';
import {
  fuseKnowledgeSearch,
  knowledgeQueryTerms,
  selectKnowledgeHits,
  truncateKnowledgeSearchText,
} from '@/modules/knowledge/helpers/knowledge-search.helpers';
import { ChunksRepository } from '@/modules/knowledge/repositories/chunks.repository';
import { KnowledgeBasesRepository } from '@/modules/knowledge/repositories/knowledge-bases.repository';
import { KnowledgeSearchRepository } from '@/modules/knowledge/repositories/knowledge-search.repository';
import { SectionsRepository } from '@/modules/knowledge/repositories/sections.repository';
import { KnowledgeEmbeddingService } from '@/modules/knowledge/services/knowledge-embedding.service';
import type {
  KnowledgeSearchQueryInput,
  KnowledgeSearchResult,
  KnowledgeSearchText,
  KnowledgeSectionMatch,
} from '@/modules/knowledge/typedefs/knowledge-search.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { IdService } from '@/platform/ids/services/id.service';

@Injectable()
export class KnowledgeSearchService {
  constructor(
    private readonly tenants: TenantTransactionService,
    private readonly knowledgeBases: KnowledgeBasesRepository,
    private readonly searchRepository: KnowledgeSearchRepository,
    private readonly sections: SectionsRepository,
    private readonly chunks: ChunksRepository,
    private readonly embeddings: KnowledgeEmbeddingService,
    private readonly ids: IdService,
  ) {}

  async search(input: KnowledgeSearchQueryInput): Promise<KnowledgeSearchResult[]> {
    const knowledgeBase = await this.tenants.run(input.workspaceId, () =>
      this.knowledgeBases.findById(input.workspaceId, input.knowledgeBaseId),
    );
    if (knowledgeBase === null) {
      throw new KnowledgeBaseNotFoundError();
    }
    const query = input.query.trim();
    const terms = knowledgeQueryTerms(query);
    const embedding = await this.embeddings.embedQuery({
      workspaceId: input.workspaceId,
      model: knowledgeBase.embeddingModel,
      dimensions: knowledgeBase.embeddingDimensions,
      query,
    });
    const lists = await this.tenants.run(input.workspaceId, async () => ({
      vector: await this.searchRepository.vectorCandidates(
        input.workspaceId,
        knowledgeBase.id,
        knowledgeBase.embeddingModel,
        knowledgeBase.embeddingDimensions,
        embedding,
        KNOWLEDGE_SEARCH_VECTOR_LIMIT,
      ),
      bm25: await this.searchRepository.bm25Candidates(
        input.workspaceId,
        knowledgeBase.id,
        knowledgeBase.embeddingModel,
        knowledgeBase.embeddingDimensions,
        terms,
        KNOWLEDGE_SEARCH_BM25_LIMIT,
      ),
      trigram: await this.searchRepository.trigramCandidates(
        input.workspaceId,
        knowledgeBase.id,
        knowledgeBase.embeddingModel,
        knowledgeBase.embeddingDimensions,
        query,
        KNOWLEDGE_SEARCH_TRIGRAM_LIMIT,
      ),
    }));
    const matches = fuseKnowledgeSearch(lists);
    const limit = Math.min(input.topK, KNOWLEDGE_SEARCH_RESULT_LIMIT);
    const candidates = matches.slice(0, limit + KNOWLEDGE_SEARCH_TEXT_MARGIN);
    const texts = await this.tenants.run(input.workspaceId, () =>
      this.loadTexts(input.workspaceId, candidates),
    );
    return selectKnowledgeHits(matches, texts, limit).flatMap((match) => {
      const text = texts.get(match.sectionId);
      return text === undefined ? [] : [this.toResult(match, text)];
    });
  }

  private async loadTexts(
    workspaceId: string,
    matches: readonly KnowledgeSectionMatch[],
  ): Promise<Map<string, KnowledgeSearchText>> {
    const contents = await this.sections.findContentsByIds(
      workspaceId,
      matches.map((match) => match.sectionId),
    );
    const texts = new Map<string, KnowledgeSearchText>();
    for (const match of matches) {
      const section = contents.get(match.sectionId);
      if (section === undefined) {
        continue;
      }
      const { candidate } = match;
      if (
        section.content !== null &&
        candidate.sectionTokenCount <= KNOWLEDGE_SEARCH_SECTION_TOKEN_LIMIT
      ) {
        texts.set(match.sectionId, {
          sectionId: match.sectionId,
          text: section.content,
          tokenCount: candidate.sectionTokenCount,
        });
        continue;
      }
      const range =
        section.content === null &&
        candidate.sectionTokenCount <= KNOWLEDGE_SEARCH_SECTION_TOKEN_LIMIT
          ? null
          : {
              from: candidate.chunkOrdinal - KNOWLEDGE_SEARCH_NEIGHBOUR_COUNT,
              to: candidate.chunkOrdinal + KNOWLEDGE_SEARCH_NEIGHBOUR_COUNT,
            };
      const chunks = await this.chunks.findBySection(workspaceId, match.sectionId, range);
      if (chunks.length === 0) {
        texts.set(match.sectionId, {
          sectionId: match.sectionId,
          text: candidate.content,
          tokenCount: candidate.tokenCount,
        });
        continue;
      }
      texts.set(match.sectionId, {
        sectionId: match.sectionId,
        text: chunks.map((chunk) => chunk.content).join(KNOWLEDGE_SEARCH_TEXT_SEPARATOR),
        tokenCount: chunks.reduce((total, chunk) => total + chunk.tokenCount, 0),
      });
    }
    return texts;
  }

  private toResult(match: KnowledgeSectionMatch, text: KnowledgeSearchText): KnowledgeSearchResult {
    const { candidate } = match;
    return {
      documentId: this.ids.toPublic(IdPrefix.KnowledgeDocument, candidate.documentId),
      documentTitle: candidate.documentTitle,
      sourceId: this.ids.toPublic(IdPrefix.KnowledgeSource, candidate.sourceId),
      sourceTitle: candidate.sourceTitle,
      sourceKind: candidate.sourceKind,
      path: candidate.path,
      text: truncateKnowledgeSearchText(text.text),
      score: match.score,
      url: candidate.url,
    };
  }
}
