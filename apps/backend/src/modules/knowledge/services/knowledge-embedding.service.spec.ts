import { describe, expect, it } from 'vitest';
import { KNOWLEDGE_EMBEDDING_COUNT_MISMATCH_MESSAGE } from '@/modules/knowledge/constants/knowledge-embedding.constants';
import { KNOWLEDGE_EMBEDDING_DIMENSIONS } from '@/modules/knowledge/constants/knowledge.constants';
import { EmbeddingCacheRepository } from '@/modules/knowledge/repositories/embedding-cache.repository';
import { KnowledgeEmbeddingService } from '@/modules/knowledge/services/knowledge-embedding.service';
import type { IndexedDocumentChunk } from '@/modules/knowledge/typedefs/chunk-index.typedefs';
import type {
  EmbeddingCacheChanges,
  EmbeddingCacheEntry,
  NewEmbeddingCacheEntry,
} from '@/modules/knowledge/typedefs/embedding-cache.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { EmbeddingModelId } from '@/platform/llm/constants/llm-model.constants';
import { EmbeddingDimensionMismatchError } from '@/platform/llm/errors/embedding-dimension-mismatch.error';
import { EmbeddingGateway } from '@/platform/llm/gateways/embedding.gateway';
import type {
  EmbeddingResult,
  EmbedOptions,
} from '@/platform/llm/typedefs/embedding-gateway.typedefs';
import {
  TEST_EMBEDDING_MODEL,
  TEST_EMBEDDING_VECTOR,
} from '@test/support/constants/knowledge-testing.constants';

const TEST_DATE = new Date('2026-05-01T09:00:00.000Z');
const TEST_WORKSPACE_ID = 'workspace-1';
const TEST_MODEL = EmbeddingModelId.JinaEmbeddingsV5TextSmall;
const TEST_DIMENSIONS = KNOWLEDGE_EMBEDDING_DIMENSIONS;

const chunk = (overrides: Partial<IndexedDocumentChunk>): IndexedDocumentChunk => ({
  sectionOrdinal: 0,
  ordinal: 0,
  content: 'Content',
  indexText: 'Index text',
  contentHash: 'hash-a',
  tokenCount: 1,
  ...overrides,
});

class FakeEmbeddingGateway extends EmbeddingGateway {
  readonly calls: { texts: readonly string[]; options: EmbedOptions }[] = [];
  vectorLimit: number | null = null;
  dimensions = TEST_DIMENSIONS;

  async embed(texts: readonly string[], options: EmbedOptions): Promise<EmbeddingResult> {
    this.calls.push({ texts, options });
    const vectors = texts
      .slice(0, this.vectorLimit ?? texts.length)
      .map(() => TEST_EMBEDDING_VECTOR);
    return {
      vectors,
      model: options.model,
      dimensions: this.dimensions,
      tokens: texts.length * 10,
    };
  }
}

class FakeEmbeddingCache {
  readonly entries = new Map<string, EmbeddingCacheEntry>();
  readonly inserted: NewEmbeddingCacheEntry[] = [];
  readonly updated: string[] = [];

  key(workspaceId: string, model: string, dimensions: number, textHash: string): string {
    return `${workspaceId}|${model}|${dimensions}|${textHash}`;
  }

  seed(textHash: string, embedding: readonly number[] = TEST_EMBEDDING_VECTOR): void {
    this.entries.set(this.key(TEST_WORKSPACE_ID, TEST_EMBEDDING_MODEL, TEST_DIMENSIONS, textHash), {
      workspaceId: TEST_WORKSPACE_ID,
      model: TEST_EMBEDDING_MODEL,
      dimensions: TEST_DIMENSIONS,
      textHash,
      embedding: [...embedding],
      createdAt: TEST_DATE,
      lastUsedAt: TEST_DATE,
    });
  }

  async find(
    workspaceId: string,
    model: string,
    dimensions: number,
    textHash: string,
  ): Promise<EmbeddingCacheEntry | null> {
    return this.entries.get(this.key(workspaceId, model, dimensions, textHash)) ?? null;
  }

  async insert(entry: NewEmbeddingCacheEntry): Promise<EmbeddingCacheEntry> {
    this.inserted.push(entry);
    const stored = { ...entry, createdAt: TEST_DATE, lastUsedAt: TEST_DATE };
    this.entries.set(
      this.key(entry.workspaceId, entry.model, entry.dimensions, entry.textHash),
      stored,
    );
    return stored;
  }

  async update(
    workspaceId: string,
    model: string,
    dimensions: number,
    textHash: string,
    changes: EmbeddingCacheChanges,
  ): Promise<EmbeddingCacheEntry | null> {
    const key = this.key(workspaceId, model, dimensions, textHash);
    const current = this.entries.get(key);
    if (current === undefined) {
      return null;
    }
    this.updated.push(textHash);
    const next = { ...current, ...changes, lastUsedAt: TEST_DATE };
    this.entries.set(key, next);
    return next;
  }
}

const tenants = {
  run: <T>(_workspaceId: string, work: () => Promise<T>): Promise<T> => work(),
} as unknown as TenantTransactionService;

const serviceWith = (gateway: FakeEmbeddingGateway, cache: FakeEmbeddingCache) =>
  new KnowledgeEmbeddingService(gateway, cache as unknown as EmbeddingCacheRepository, tenants);

const input = (chunks: readonly IndexedDocumentChunk[]) => ({
  workspaceId: TEST_WORKSPACE_ID,
  model: TEST_MODEL,
  dimensions: TEST_DIMENSIONS,
  chunks,
});

describe('KnowledgeEmbeddingService', () => {
  it('returns no chunks for an empty input', async () => {
    const gateway = new FakeEmbeddingGateway();
    const cache = new FakeEmbeddingCache();

    await expect(serviceWith(gateway, cache).embed(input([]))).resolves.toEqual({
      chunks: [],
    });
    expect(gateway.calls).toHaveLength(0);
  });

  it('reuses cached embeddings and embeds only misses', async () => {
    const gateway = new FakeEmbeddingGateway();
    const cache = new FakeEmbeddingCache();
    cache.seed('hash-a');

    const result = await serviceWith(gateway, cache).embed(
      input([
        chunk({ contentHash: 'hash-a' }),
        chunk({ contentHash: 'hash-b', indexText: 'Index text B' }),
      ]),
    );

    expect(gateway.calls).toHaveLength(1);
    expect(gateway.calls[0]?.texts).toEqual(['Index text B']);
    expect(gateway.calls[0]?.options).toMatchObject({
      model: TEST_MODEL,
      tags: { traceName: 'knowledge.chunk.embedding', workspaceId: TEST_WORKSPACE_ID },
    });
    expect(result.chunks.map(({ embedding }) => embedding)).toEqual([
      TEST_EMBEDDING_VECTOR,
      TEST_EMBEDDING_VECTOR,
    ]);
    expect(cache.inserted).toHaveLength(1);
    expect(cache.updated).toEqual(['hash-a']);
  });

  it('embeds a duplicate hash once and reuses its vector', async () => {
    const gateway = new FakeEmbeddingGateway();
    const cache = new FakeEmbeddingCache();

    const result = await serviceWith(gateway, cache).embed(
      input([
        chunk({ ordinal: 0, contentHash: 'hash-a', indexText: 'Same text' }),
        chunk({ ordinal: 1, contentHash: 'hash-a', indexText: 'Same text' }),
      ]),
    );

    expect(gateway.calls).toHaveLength(1);
    expect(gateway.calls[0]?.texts).toEqual(['Same text']);
    expect(cache.inserted).toHaveLength(1);
    expect(result.chunks[0]?.embedding).toEqual(result.chunks[1]?.embedding);
  });

  it('does not call the gateway when every embedding is cached', async () => {
    const gateway = new FakeEmbeddingGateway();
    const cache = new FakeEmbeddingCache();
    cache.seed('hash-a');
    cache.seed('hash-b');

    const result = await serviceWith(gateway, cache).embed(
      input([chunk({ contentHash: 'hash-a' }), chunk({ contentHash: 'hash-b' })]),
    );

    expect(gateway.calls).toHaveLength(0);
    expect(result.chunks).toHaveLength(2);
    expect(cache.inserted).toHaveLength(0);
    expect(cache.updated).toEqual(['hash-a', 'hash-b']);
  });

  it('fails when the gateway returns the wrong number of vectors', async () => {
    const gateway = new FakeEmbeddingGateway();
    gateway.vectorLimit = 1;

    await expect(
      serviceWith(gateway, new FakeEmbeddingCache()).embed(
        input([chunk({ contentHash: 'hash-a' }), chunk({ contentHash: 'hash-b' })]),
      ),
    ).rejects.toThrow(KNOWLEDGE_EMBEDDING_COUNT_MISMATCH_MESSAGE);
  });

  it('fails when the gateway returns vectors of the wrong dimension', async () => {
    const gateway = new FakeEmbeddingGateway();
    gateway.dimensions = 2;

    await expect(
      serviceWith(gateway, new FakeEmbeddingCache()).embed(input([chunk({})])),
    ).rejects.toBeInstanceOf(EmbeddingDimensionMismatchError);
  });
});
