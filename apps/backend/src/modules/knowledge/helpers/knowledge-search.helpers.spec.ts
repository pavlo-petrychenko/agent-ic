import { describe, expect, it } from 'vitest';
import {
  KNOWLEDGE_SEARCH_RRF_K,
  KNOWLEDGE_SEARCH_TERM_LIMIT,
  KNOWLEDGE_SEARCH_TEXT_MAX_LENGTH,
} from '@/modules/knowledge/constants/knowledge-search.constants';
import { KnowledgeSourceKind } from '@/modules/knowledge/constants/knowledge.constants';
import {
  fuseKnowledgeSearch,
  knowledgeQueryTerms,
  knowledgeRrfScore,
  selectKnowledgeHits,
  truncateKnowledgeSearchText,
} from '@/modules/knowledge/helpers/knowledge-search.helpers';
import type {
  KnowledgeSearchCandidate,
  KnowledgeSearchText,
} from '@/modules/knowledge/typedefs/knowledge-search.typedefs';

const candidate = (
  chunkId: string,
  sectionId: string,
  overrides: Partial<KnowledgeSearchCandidate> = {},
): KnowledgeSearchCandidate => ({
  chunkId,
  chunkOrdinal: 0,
  sectionId,
  documentId: `document-${sectionId}`,
  documentTitle: 'Refund policy',
  sourceId: 'source-1',
  sourceTitle: 'Policies',
  sourceKind: KnowledgeSourceKind.Upload,
  path: 'Policies',
  content: 'Refunds are processed within five days.',
  tokenCount: 10,
  sectionTokenCount: 10,
  url: null,
  ...overrides,
});

const text = (sectionId: string, tokenCount = 10): KnowledgeSearchText => ({
  sectionId,
  text: `text-${sectionId}`,
  tokenCount,
});

describe('knowledgeQueryTerms', () => {
  it('normalizes, deduplicates and limits query terms', () => {
    expect(knowledgeQueryTerms('  Refund — REFUND, refund! ')).toEqual(['refund']);
    expect(knowledgeQueryTerms('   ')).toEqual([]);
  });

  it('keeps the configured number of unique terms', () => {
    const terms = knowledgeQueryTerms(
      Array.from({ length: KNOWLEDGE_SEARCH_TERM_LIMIT + 10 }, (_, index) => `term${index}`).join(
        ' ',
      ),
    );
    expect(terms).toHaveLength(KNOWLEDGE_SEARCH_TERM_LIMIT);
  });
});

describe('knowledgeRrfScore', () => {
  it('scores earlier ranks higher', () => {
    expect(knowledgeRrfScore(1, 1)).toBe(1 / (KNOWLEDGE_SEARCH_RRF_K + 1));
    expect(knowledgeRrfScore(1, 1)).toBeGreaterThan(knowledgeRrfScore(2, 1));
    expect(knowledgeRrfScore(1, 0.5)).toBeLessThan(knowledgeRrfScore(1, 1));
  });
});

describe('fuseKnowledgeSearch', () => {
  it('sums one contribution per section per list and orders by score', () => {
    const matches = fuseKnowledgeSearch({
      vector: [
        candidate('chunk-a', 'section-a'),
        candidate('chunk-a-2', 'section-a'),
        candidate('chunk-b', 'section-b'),
      ],
      bm25: [candidate('chunk-b', 'section-b'), candidate('chunk-a', 'section-a')],
      trigram: [candidate('chunk-c', 'section-c')],
    });

    expect(matches.map((match) => match.sectionId)).toEqual([
      'section-a',
      'section-b',
      'section-c',
    ]);
    expect(matches[0]?.score).toBeCloseTo(knowledgeRrfScore(1, 1) + knowledgeRrfScore(2, 1));
    expect(matches[1]?.score).toBeCloseTo(knowledgeRrfScore(3, 1) + knowledgeRrfScore(1, 1));
    expect(matches[2]?.score).toBeCloseTo(knowledgeRrfScore(1, 0.5));
  });

  it('returns an empty list when every candidate list is empty', () => {
    expect(fuseKnowledgeSearch({ vector: [], bm25: [], trigram: [] })).toEqual([]);
  });
});

describe('truncateKnowledgeSearchText', () => {
  it('keeps short text and cuts oversized text with an ellipsis', () => {
    expect(truncateKnowledgeSearchText('short')).toBe('short');
    const long = 'a'.repeat(KNOWLEDGE_SEARCH_TEXT_MAX_LENGTH + 10);
    expect(truncateKnowledgeSearchText(long)).toHaveLength(KNOWLEDGE_SEARCH_TEXT_MAX_LENGTH + 1);
    expect(truncateKnowledgeSearchText(long).endsWith('…')).toBe(true);
  });
});

describe('selectKnowledgeHits', () => {
  it('caps results by count and tokens, always keeping the first hit', () => {
    const matches = fuseKnowledgeSearch({
      vector: [
        candidate('chunk-a', 'section-a'),
        candidate('chunk-b', 'section-b'),
        candidate('chunk-c', 'section-c'),
      ],
      bm25: [],
      trigram: [],
    });
    const texts = new Map([
      ['section-a', text('section-a', 3000)],
      ['section-b', text('section-b', 900)],
      ['section-c', text('section-c', 200)],
    ]);

    expect(selectKnowledgeHits(matches, texts, 3, 4000).map((hit) => hit.sectionId)).toEqual([
      'section-a',
      'section-b',
    ]);
  });

  it('skips sections without loaded text', () => {
    const matches = fuseKnowledgeSearch({
      vector: [candidate('chunk-a', 'section-a'), candidate('chunk-b', 'section-b')],
      bm25: [],
      trigram: [],
    });

    expect(
      selectKnowledgeHits(matches, new Map([['section-b', text('section-b')]]), 2).map(
        (hit) => hit.sectionId,
      ),
    ).toEqual(['section-b']);
  });
});
