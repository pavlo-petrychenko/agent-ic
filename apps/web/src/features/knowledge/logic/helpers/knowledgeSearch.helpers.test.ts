import { describe, expect, it } from 'vitest';
import { KnowledgeSourceKind } from '@/features/knowledge/constants/knowledgeSource.constants';
import {
  isKnowledgeSearchTextLong,
  knowledgeSearchLocation,
  knowledgeSearchScoreLabel,
  knowledgeSearchScorePercent,
  toPlaygroundResults,
} from '@/features/knowledge/logic/helpers/knowledgeSearch.helpers';
import type { KnowledgeSearchResult } from '@/features/knowledge/typedefs/knowledgeSearch.typedefs';

const result = (overrides: Partial<KnowledgeSearchResult> = {}): KnowledgeSearchResult => ({
  documentId: 'kdc_document',
  documentTitle: 'Refund policy',
  sourceId: 'kso_source',
  sourceTitle: 'Policies',
  sourceKind: KnowledgeSourceKind.Upload,
  path: 'Refunds',
  text: 'Refunds are processed within five days.',
  score: 0.049,
  url: null,
  ...overrides,
});

describe('knowledge search helpers', () => {
  it('formats the score relative to the best result', () => {
    expect(knowledgeSearchScoreLabel(0.049, 0.049)).toBe('1.00');
    expect(knowledgeSearchScoreLabel(0.0166, 0.049)).toBe('0.34');
  });

  it('turns a score into a percentage of the best result', () => {
    expect(knowledgeSearchScorePercent(0.02, 0.04)).toBe(50);
    expect(knowledgeSearchScorePercent(0.05, 0.04)).toBe(100);
    expect(knowledgeSearchScorePercent(0.02, 0)).toBe(0);
  });

  it('detects long section text for the expand control', () => {
    expect(isKnowledgeSearchTextLong('short')).toBe(false);
    expect(isKnowledgeSearchTextLong('a'.repeat(300))).toBe(true);
  });

  it('builds the document location without repeating the title', () => {
    expect(knowledgeSearchLocation(result())).toBe('Refund policy · Refunds');
    expect(knowledgeSearchLocation(result({ path: '' }))).toBe('Refund policy');
    expect(knowledgeSearchLocation(result({ path: 'Refund policy' }))).toBe('Refund policy');
  });

  it('maps results to playground view data', () => {
    const views = toPlaygroundResults([
      result(),
      result({ score: 0.025, path: '', text: 'a'.repeat(300) }),
    ]);

    expect(views[0]).toEqual({
      key: 'kdc_document-Refunds-0',
      sourceKind: KnowledgeSourceKind.Upload,
      sourceTitle: 'Policies',
      scoreLabel: '1.00',
      scorePercent: 100,
      text: 'Refunds are processed within five days.',
      isLong: false,
      location: 'Refund policy · Refunds',
    });
    expect(views[1]?.scorePercent).toBeCloseTo((0.025 / 0.049) * 100);
    expect(views[1]?.isLong).toBe(true);
    expect(views[1]?.location).toBe('Refund policy');
  });
});
