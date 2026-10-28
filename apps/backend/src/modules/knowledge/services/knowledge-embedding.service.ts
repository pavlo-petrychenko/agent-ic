import { Injectable } from '@nestjs/common';
import {
  KNOWLEDGE_EMBEDDING_COUNT_MISMATCH_MESSAGE,
  KNOWLEDGE_EMBEDDING_MISSING_MESSAGE,
  KNOWLEDGE_EMBEDDING_TRACE_NAME,
} from '@/modules/knowledge/constants/knowledge-embedding.constants';
import { EmbeddingCacheRepository } from '@/modules/knowledge/repositories/embedding-cache.repository';
import type { IndexedDocumentChunk } from '@/modules/knowledge/typedefs/chunk-index.typedefs';
import type {
  EmbeddedDocumentChunk,
  KnowledgeEmbeddingInput,
  KnowledgeEmbeddingResult,
} from '@/modules/knowledge/typedefs/knowledge-embedding.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { EmbeddingDimensionMismatchError } from '@/platform/llm/errors/embedding-dimension-mismatch.error';
import { EmbeddingGateway } from '@/platform/llm/gateways/embedding.gateway';

@Injectable()
export class KnowledgeEmbeddingService {
  constructor(
    private readonly gateway: EmbeddingGateway,
    private readonly cache: EmbeddingCacheRepository,
    private readonly tenants: TenantTransactionService,
  ) {}

  async embed(input: KnowledgeEmbeddingInput): Promise<KnowledgeEmbeddingResult> {
    if (input.chunks.length === 0) {
      return { chunks: [], tokens: 0 };
    }
    const chunksByHash = new Map<string, IndexedDocumentChunk>();
    for (const chunk of input.chunks) {
      if (!chunksByHash.has(chunk.contentHash)) {
        chunksByHash.set(chunk.contentHash, chunk);
      }
    }
    const cached = await this.tenants.run(input.workspaceId, async () => {
      const entries = new Map<string, readonly number[]>();
      for (const contentHash of chunksByHash.keys()) {
        const entry = await this.cache.find(
          input.workspaceId,
          input.model,
          input.dimensions,
          contentHash,
        );
        if (entry !== null) {
          entries.set(contentHash, entry.embedding);
        }
      }
      return entries;
    });
    const misses = Array.from(chunksByHash.entries())
      .filter(([contentHash]) => !cached.has(contentHash))
      .map(([, chunk]) => chunk);

    let tokens = 0;
    let embeddingModel = input.model;
    let embeddingDimensions = input.dimensions;
    const fresh = new Map<string, readonly number[]>();
    if (misses.length > 0) {
      const result = await this.gateway.embed(
        misses.map((chunk) => chunk.indexText),
        {
          model: input.model,
          tags: {
            traceName: KNOWLEDGE_EMBEDDING_TRACE_NAME,
            workspaceId: input.workspaceId,
          },
        },
      );
      if (result.vectors.length !== misses.length) {
        throw new Error(KNOWLEDGE_EMBEDDING_COUNT_MISMATCH_MESSAGE);
      }
      if (result.dimensions !== input.dimensions) {
        throw new EmbeddingDimensionMismatchError(
          result.model,
          input.dimensions,
          result.dimensions,
        );
      }
      tokens = result.tokens;
      embeddingModel = result.model;
      embeddingDimensions = result.dimensions;
      for (const [index, chunk] of misses.entries()) {
        const embedding = result.vectors[index];
        if (embedding === undefined) {
          throw new Error(KNOWLEDGE_EMBEDDING_MISSING_MESSAGE);
        }
        fresh.set(chunk.contentHash, embedding);
      }
    }

    await this.tenants.run(input.workspaceId, async () => {
      for (const contentHash of cached.keys()) {
        await this.cache.update(input.workspaceId, input.model, input.dimensions, contentHash, {});
      }
      for (const [contentHash, embedding] of fresh) {
        await this.cache.insert({
          workspaceId: input.workspaceId,
          model: input.model,
          dimensions: input.dimensions,
          textHash: contentHash,
          embedding: [...embedding],
        });
      }
    });

    const chunks = input.chunks.map((chunk): EmbeddedDocumentChunk => {
      const embedding = cached.get(chunk.contentHash) ?? fresh.get(chunk.contentHash);
      if (embedding === undefined) {
        throw new Error(KNOWLEDGE_EMBEDDING_MISSING_MESSAGE);
      }
      return {
        ...chunk,
        embedding,
        embeddingModel,
        embeddingDimensions,
      };
    });
    return { chunks, tokens };
  }
}
