import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { knowledgeToolInputSchema } from '@/modules/knowledge/constants/knowledge-tool.constants';
import { KNOWLEDGE_EMBEDDING_DIMENSIONS } from '@/modules/knowledge/constants/knowledge.constants';
import { SectionsRepository } from '@/modules/knowledge/repositories/sections.repository';
import { KnowledgeToolsService } from '@/modules/knowledge/services/knowledge-tools.service';
import type { KnowledgeToolOutput } from '@/modules/knowledge/typedefs/knowledge-tool.typedefs';
import { EmbeddingGateway } from '@/platform/llm/gateways/embedding.gateway';
import type {
  EmbedOptions,
  EmbeddingResult,
} from '@/platform/llm/typedefs/embedding-gateway.typedefs';
import {
  TEST_CHUNK_CONTENT,
  TEST_EMBEDDING_VECTOR,
  TEST_KB_TOOL_NAME,
} from '@test/support/constants/knowledge-testing.constants';
import {
  createKnowledgeTestbed,
  publicKnowledgeBaseId,
  publicKnowledgeDocumentId,
  publicKnowledgeSourceId,
  seedKnowledgeBase,
  seedKnowledgeChunk,
  seedKnowledgeChunkTerm,
  seedKnowledgeDocument,
  seedKnowledgeSection,
  seedKnowledgeSource,
} from '@test/support/helpers/knowledge-testing.helpers';
import type { KnowledgeTestbed } from '@test/support/typedefs/knowledge-testing.typedefs';

class FakeEmbeddingGateway extends EmbeddingGateway {
  async embed(texts: readonly string[], options: EmbedOptions): Promise<EmbeddingResult> {
    return {
      vectors: texts.map(() => TEST_EMBEDDING_VECTOR),
      model: options.model,
      dimensions: KNOWLEDGE_EMBEDDING_DIMENSIONS,
      tokens: texts.length,
    };
  }
}

const MALFORMED_ID = 'made-up-value';
const UNKNOWN_SOURCE_ID = 'ks_00000000000000000000000000';

interface IndexedDocument {
  readonly sourceId: string;
  readonly documentId: string;
}

interface SeededKnowledgeBase {
  readonly workspaceId: string;
  readonly knowledgeBaseId: string;
  readonly first: IndexedDocument;
  readonly second: IndexedDocument;
}

describe('KnowledgeToolsService', () => {
  let testbed: KnowledgeTestbed;
  let service: KnowledgeToolsService;

  beforeAll(async () => {
    testbed = await createKnowledgeTestbed([
      { token: EmbeddingGateway, value: new FakeEmbeddingGateway() },
    ]);
    service = testbed.module.get(KnowledgeToolsService);
  });

  afterAll(async () => {
    await testbed.module.close();
  });

  const indexDocument = async (
    workspaceId: string,
    knowledgeBaseId: string,
  ): Promise<IndexedDocument> => {
    const sourceId = await seedKnowledgeSource(testbed, workspaceId, knowledgeBaseId);
    const documentId = await seedKnowledgeDocument(testbed, workspaceId, knowledgeBaseId, sourceId);
    const sectionId = await seedKnowledgeSection(testbed, workspaceId, knowledgeBaseId, documentId);
    await testbed.tenants.run(workspaceId, () =>
      testbed.module.get(SectionsRepository).update(workspaceId, sectionId, {
        content: TEST_CHUNK_CONTENT,
        tokenCount: 10,
      }),
    );
    const chunkId = await seedKnowledgeChunk(
      testbed,
      workspaceId,
      knowledgeBaseId,
      documentId,
      sectionId,
    );
    await seedKnowledgeChunkTerm(testbed, workspaceId, knowledgeBaseId, chunkId);
    return { sourceId, documentId };
  };

  const seed = async (): Promise<SeededKnowledgeBase> => {
    const workspaceId = testbed.ids.generate();
    const knowledgeBaseId = await seedKnowledgeBase(testbed, workspaceId);
    const first = await indexDocument(workspaceId, knowledgeBaseId);
    const second = await indexDocument(workspaceId, knowledgeBaseId);
    return { workspaceId, knowledgeBaseId, first, second };
  };

  const call = async (
    seeded: SeededKnowledgeBase,
    input: Record<string, unknown>,
  ): Promise<KnowledgeToolOutput> => {
    const tools = await service.toolsFor(seeded.workspaceId, [
      publicKnowledgeBaseId(testbed, seeded.knowledgeBaseId),
    ]);
    const tool = tools[TEST_KB_TOOL_NAME];
    if (tool === undefined) {
      throw new Error('tool missing');
    }
    return (await tool.execute({ query: 'refund', ...input })) as KnowledgeToolOutput;
  };

  const sourceIdsOf = (output: KnowledgeToolOutput): string[] =>
    [...new Set(output.results.map((result) => result.source_id))].sort();

  const publicSourceIds = (...documents: IndexedDocument[]): string[] =>
    documents.map(({ sourceId }) => publicKnowledgeSourceId(testbed, sourceId)).sort();

  it('accepts null scope fields in the input schema', () => {
    expect(
      knowledgeToolInputSchema.safeParse({ query: 'refund', source_id: null, document_id: null })
        .success,
    ).toBe(true);
  });

  it.each([
    ['absent', {}],
    ['null', { source_id: null, document_id: null }],
    ['empty strings', { source_id: '', document_id: '' }],
  ])('searches the whole knowledge base when the scope is %s', async (_name, scope) => {
    const seeded = await seed();

    const output = await call(seeded, scope);

    expect(output.error).toBeUndefined();
    expect(output.found).toBe(true);
    expect(sourceIdsOf(output)).toEqual(publicSourceIds(seeded.first, seeded.second));
  });

  it('searches the whole knowledge base when the ids are malformed', async () => {
    const seeded = await seed();

    const output = await call(seeded, { source_id: MALFORMED_ID, document_id: MALFORMED_ID });

    expect(output.error).toBeUndefined();
    expect(output.found).toBe(true);
    expect(sourceIdsOf(output)).toEqual(publicSourceIds(seeded.first, seeded.second));
  });

  it('searches the whole knowledge base when the ids are well formed but unknown', async () => {
    const seeded = await seed();

    const output = await call(seeded, { source_id: UNKNOWN_SOURCE_ID });

    expect(output.error).toBeUndefined();
    expect(sourceIdsOf(output)).toEqual(publicSourceIds(seeded.first, seeded.second));
  });

  it('ignores the ids of another knowledge base', async () => {
    const seeded = await seed();
    const other = await seed();

    const output = await call(seeded, {
      source_id: publicKnowledgeSourceId(testbed, other.first.sourceId),
      document_id: publicKnowledgeDocumentId(testbed, other.first.documentId),
    });

    expect(output.error).toBeUndefined();
    expect(output.found).toBe(true);
    expect(sourceIdsOf(output)).toEqual(publicSourceIds(seeded.first, seeded.second));
  });

  it('searches only the given source', async () => {
    const seeded = await seed();

    const output = await call(seeded, {
      source_id: publicKnowledgeSourceId(testbed, seeded.first.sourceId),
    });

    expect(sourceIdsOf(output)).toEqual(publicSourceIds(seeded.first));
  });

  it('searches only the given document', async () => {
    const seeded = await seed();

    const output = await call(seeded, {
      document_id: publicKnowledgeDocumentId(testbed, seeded.second.documentId),
    });

    expect(output.results.map((result) => result.document_id)).toEqual([
      publicKnowledgeDocumentId(testbed, seeded.second.documentId),
    ]);
  });

  it('ignores a document that is not in the given source', async () => {
    const seeded = await seed();

    const output = await call(seeded, {
      source_id: publicKnowledgeSourceId(testbed, seeded.first.sourceId),
      document_id: publicKnowledgeDocumentId(testbed, seeded.second.documentId),
    });

    expect(sourceIdsOf(output)).toEqual(publicSourceIds(seeded.first));
  });
});
