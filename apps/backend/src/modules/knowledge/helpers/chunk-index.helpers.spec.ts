import { describe, expect, it } from 'vitest';
import { KNOWLEDGE_CHUNK_INDEX_MISSING_SECTION_MESSAGE } from '@/modules/knowledge/constants/knowledge-chunk-index.constants';
import { buildIndexedChunks } from '@/modules/knowledge/helpers/chunk-index.helpers';
import { buildDocumentChunks } from '@/modules/knowledge/helpers/chunking.helpers';
import { contentHash } from '@/modules/knowledge/helpers/content-hash.helpers';
import { buildDocumentSections } from '@/modules/knowledge/helpers/section-tree.helpers';
import type { DocumentChunk } from '@/modules/knowledge/typedefs/document-chunk.typedefs';

const sections = buildDocumentSections('Intro\n\n# Pricing\n\nService prices.\n');
const chunks = buildDocumentChunks(sections);

describe('buildIndexedChunks', () => {
  it('builds index text from title, path, summary and content', () => {
    const indexed = buildIndexedChunks({
      title: 'Handbook',
      summary: 'Price list.',
      sections,
      chunks,
    });

    expect(indexed.map(({ indexText }) => indexText)).toEqual([
      'Handbook\n\nPrice list.\n\nIntro',
      'Handbook\n\nPricing\n\nPrice list.\n\nService prices.',
    ]);
    for (const chunk of indexed) {
      expect(chunk.contentHash).toBe(contentHash(chunk.indexText));
    }
  });

  it('omits an empty path and a missing summary', () => {
    const [chunk] = buildIndexedChunks({ title: 'Handbook', sections, chunks });

    expect(chunk?.indexText).toBe('Handbook\n\nIntro');
  });

  it('changes only index text and hash when the summary changes', () => {
    const [withoutSummary] = buildIndexedChunks({ title: 'Handbook', sections, chunks });
    const [withSummary] = buildIndexedChunks({
      title: 'Handbook',
      summary: 'Price list.',
      sections,
      chunks,
    });

    expect(withoutSummary?.content).toBe(withSummary?.content);
    expect(withoutSummary?.tokenCount).toBe(withSummary?.tokenCount);
    expect(withoutSummary?.indexText).not.toBe(withSummary?.indexText);
    expect(withoutSummary?.contentHash).not.toBe(withSummary?.contentHash);
  });

  it('rejects a chunk whose section is missing', () => {
    const orphan: DocumentChunk = {
      sectionOrdinal: 99,
      ordinal: 0,
      content: 'Orphan',
      tokenCount: 1,
    };

    expect(() => buildIndexedChunks({ title: 'Handbook', sections, chunks: [orphan] })).toThrow(
      KNOWLEDGE_CHUNK_INDEX_MISSING_SECTION_MESSAGE,
    );
  });
});
