import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { KNOWLEDGE_EMBEDDING_DIMENSIONS } from '@/modules/knowledge/constants/knowledge.constants';
import { ChunkTermsRepository } from '@/modules/knowledge/repositories/chunk-terms.repository';
import { ChunksRepository } from '@/modules/knowledge/repositories/chunks.repository';
import { DocumentsRepository } from '@/modules/knowledge/repositories/documents.repository';
import { KnowledgeSearchRepository } from '@/modules/knowledge/repositories/knowledge-search.repository';
import { SectionsRepository } from '@/modules/knowledge/repositories/sections.repository';
import { SourcesRepository } from '@/modules/knowledge/repositories/sources.repository';
import type { NewChunk } from '@/modules/knowledge/typedefs/chunk.typedefs';
import type { NewSection } from '@/modules/knowledge/typedefs/section.typedefs';
import {
  TEST_CHUNK_CONTENT,
  TEST_EMBEDDING_MODEL,
  TEST_SECTION_PATH,
} from '@test/support/constants/knowledge-testing.constants';
import { newChunk, newSection } from '@test/support/fixtures/knowledge.fixture';
import {
  createKnowledgeTestbed,
  seedKnowledgeBase,
  seedKnowledgeDocument,
  seedKnowledgeSection,
  seedKnowledgeSource,
} from '@test/support/helpers/knowledge-testing.helpers';
import { ensureWorkspaceRow } from '@test/support/helpers/parent-rows.helpers';
import type { KnowledgeTestbed } from '@test/support/typedefs/knowledge-testing.typedefs';

const vector = (index: number): number[] =>
  Array.from({ length: KNOWLEDGE_EMBEDDING_DIMENSIONS }, (_, position) =>
    position === index ? 1 : 0,
  );

interface SeededKnowledge {
  readonly workspaceId: string;
  readonly knowledgeBaseId: string;
  readonly sourceId: string;
  readonly documentId: string;
  readonly sectionId: string;
}

describe('KnowledgeSearchRepository', () => {
  let testbed: KnowledgeTestbed;
  let repository: KnowledgeSearchRepository;

  beforeAll(async () => {
    testbed = await createKnowledgeTestbed();
    repository = testbed.module.get(KnowledgeSearchRepository);
  });

  afterAll(async () => {
    await testbed.module.close();
  });

  const seed = async (): Promise<SeededKnowledge> => {
    const workspaceId = testbed.ids.generate();
    await ensureWorkspaceRow(testbed.module, workspaceId);
    const knowledgeBaseId = await seedKnowledgeBase(testbed, workspaceId);
    const sourceId = await seedKnowledgeSource(testbed, workspaceId, knowledgeBaseId);
    const documentId = await seedKnowledgeDocument(testbed, workspaceId, knowledgeBaseId, sourceId);
    const sectionId = await seedKnowledgeSection(testbed, workspaceId, knowledgeBaseId, documentId);
    return { workspaceId, knowledgeBaseId, sourceId, documentId, sectionId };
  };

  const insertChunk = async (
    seeded: SeededKnowledge,
    chunk: Partial<NewChunk> & Pick<NewChunk, 'id' | 'generation' | 'ordinal'>,
    sectionId: string = seeded.sectionId,
  ): Promise<string> => {
    await testbed.tenants.run(seeded.workspaceId, () =>
      testbed.module.get(ChunksRepository).insert({
        ...newChunk(
          chunk.id,
          seeded.workspaceId,
          seeded.knowledgeBaseId,
          seeded.documentId,
          sectionId,
        ),
        ...chunk,
      }),
    );
    return chunk.id;
  };

  const insertTerm = async (
    seeded: SeededKnowledge,
    chunkId: string,
    term: string,
    frequency: number,
  ): Promise<void> => {
    await testbed.tenants.run(seeded.workspaceId, () =>
      testbed.module.get(ChunkTermsRepository).insert({
        workspaceId: seeded.workspaceId,
        kbId: seeded.knowledgeBaseId,
        chunkId,
        term,
        frequency,
      }),
    );
  };

  it('returns only chunks of the active generation', async () => {
    const seeded = await seed();
    const oldChunk = await insertChunk(seeded, {
      id: testbed.ids.generate(),
      generation: 0,
      ordinal: 0,
      content: 'The old refund policy.',
      embedding: vector(1),
    });
    const newSectionId = testbed.ids.generate();
    await testbed.tenants.run(seeded.workspaceId, () =>
      testbed.module.get(SectionsRepository).insert({
        ...newSection(newSectionId, seeded.workspaceId, seeded.knowledgeBaseId, seeded.documentId),
        generation: 1,
        ordinal: 0,
      }),
    );
    const newChunkId = await insertChunk(
      seeded,
      {
        id: testbed.ids.generate(),
        generation: 1,
        ordinal: 0,
        content: 'The new refund policy.',
        embedding: vector(0),
      },
      newSectionId,
    );
    await insertTerm(seeded, oldChunk, 'refund', 1);
    await insertTerm(seeded, newChunkId, 'refund', 1);
    await testbed.tenants.run(seeded.workspaceId, () =>
      testbed.module
        .get(DocumentsRepository)
        .update(seeded.workspaceId, seeded.documentId, { activeGeneration: 1 }),
    );

    const vectorHits = await testbed.tenants.run(seeded.workspaceId, () =>
      repository.vectorCandidates(
        seeded.workspaceId,
        seeded.knowledgeBaseId,
        TEST_EMBEDDING_MODEL,
        KNOWLEDGE_EMBEDDING_DIMENSIONS,
        vector(0),
        10,
      ),
    );
    const bm25Hits = await testbed.tenants.run(seeded.workspaceId, () =>
      repository.bm25Candidates(
        seeded.workspaceId,
        seeded.knowledgeBaseId,
        TEST_EMBEDDING_MODEL,
        KNOWLEDGE_EMBEDDING_DIMENSIONS,
        ['refund'],
        10,
      ),
    );
    const trigramHits = await testbed.tenants.run(seeded.workspaceId, () =>
      repository.trigramCandidates(
        seeded.workspaceId,
        seeded.knowledgeBaseId,
        TEST_EMBEDDING_MODEL,
        KNOWLEDGE_EMBEDDING_DIMENSIONS,
        'refund',
        10,
      ),
    );

    expect(vectorHits.map((hit) => hit.chunkId)).toEqual([newChunkId]);
    expect(bm25Hits.map((hit) => hit.chunkId)).toEqual([newChunkId]);
    expect(trigramHits.map((hit) => hit.chunkId)).toEqual([newChunkId]);
  });

  it('keeps workspaces apart', async () => {
    const first = await seed();
    const second = await seed();
    const firstChunk = await insertChunk(first, {
      id: testbed.ids.generate(),
      generation: 0,
      ordinal: 0,
      embedding: vector(0),
    });
    const secondChunk = await insertChunk(second, {
      id: testbed.ids.generate(),
      generation: 0,
      ordinal: 0,
      embedding: vector(0),
    });
    await insertTerm(first, firstChunk, 'refund', 1);
    await insertTerm(second, secondChunk, 'refund', 1);

    const hits = await testbed.tenants.run(first.workspaceId, () =>
      repository.vectorCandidates(
        first.workspaceId,
        first.knowledgeBaseId,
        TEST_EMBEDDING_MODEL,
        KNOWLEDGE_EMBEDDING_DIMENSIONS,
        vector(0),
        10,
      ),
    );

    expect(hits.map((hit) => hit.chunkId)).toEqual([firstChunk]);
  });

  it('ignores a deleted source and a deleted document', async () => {
    const seeded = await seed();
    await insertChunk(seeded, {
      id: testbed.ids.generate(),
      generation: 0,
      ordinal: 0,
      embedding: vector(0),
    });
    await testbed.tenants.run(seeded.workspaceId, () =>
      testbed.module
        .get(SourcesRepository)
        .softDelete(seeded.workspaceId, seeded.sourceId, testbed.clock.now()),
    );

    const afterSourceDelete = await testbed.tenants.run(seeded.workspaceId, () =>
      repository.vectorCandidates(
        seeded.workspaceId,
        seeded.knowledgeBaseId,
        TEST_EMBEDDING_MODEL,
        KNOWLEDGE_EMBEDDING_DIMENSIONS,
        vector(0),
        10,
      ),
    );
    expect(afterSourceDelete).toEqual([]);

    const second = await seed();
    await insertChunk(second, {
      id: testbed.ids.generate(),
      generation: 0,
      ordinal: 0,
      embedding: vector(0),
    });
    await testbed.tenants.run(second.workspaceId, () =>
      testbed.module
        .get(DocumentsRepository)
        .softDelete(second.workspaceId, second.documentId, testbed.clock.now()),
    );

    const afterDocumentDelete = await testbed.tenants.run(second.workspaceId, () =>
      repository.vectorCandidates(
        second.workspaceId,
        second.knowledgeBaseId,
        TEST_EMBEDDING_MODEL,
        KNOWLEDGE_EMBEDDING_DIMENSIONS,
        vector(0),
        10,
      ),
    );
    expect(afterDocumentDelete).toEqual([]);
  });

  it('stores the section content and reads it back', async () => {
    const seeded = await seed();
    const section: NewSection = {
      ...newSection(
        testbed.ids.generate(),
        seeded.workspaceId,
        seeded.knowledgeBaseId,
        seeded.documentId,
      ),
      content: TEST_CHUNK_CONTENT,
      ordinal: 1,
      path: TEST_SECTION_PATH,
      tokenCount: 12,
    };
    await testbed.tenants.run(seeded.workspaceId, () =>
      testbed.module.get(SectionsRepository).insert(section),
    );

    const contents = await testbed.tenants.run(seeded.workspaceId, () =>
      testbed.module.get(SectionsRepository).findContentsByIds(seeded.workspaceId, [section.id]),
    );

    expect(contents.get(section.id)).toEqual({ content: TEST_CHUNK_CONTENT, tokenCount: 12 });
    expect(contents.get(seeded.sectionId)).toBeUndefined();
  });
});
