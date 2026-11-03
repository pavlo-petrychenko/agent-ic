import {
  KNOWLEDGE_SEARCH_SCORE_PRECISION,
  KNOWLEDGE_SEARCH_TEXT_PREVIEW_LENGTH,
} from '@/features/knowledge/constants/knowledgeSearch.constants';
import type {
  KnowledgeSearchResult,
  PlaygroundResultView,
} from '@/features/knowledge/typedefs/knowledgeSearch.typedefs';

export const knowledgeSearchScoreLabel = (score: number): string =>
  score.toFixed(KNOWLEDGE_SEARCH_SCORE_PRECISION);

export const knowledgeSearchScorePercent = (score: number, maxScore: number): number =>
  maxScore <= 0 ? 0 : Math.min(100, Math.max(0, (score / maxScore) * 100));

export const isKnowledgeSearchTextLong = (text: string): boolean =>
  text.length > KNOWLEDGE_SEARCH_TEXT_PREVIEW_LENGTH;

export const knowledgeSearchLocation = (result: KnowledgeSearchResult): string =>
  result.path.length === 0 || result.path === result.documentTitle
    ? result.documentTitle
    : `${result.documentTitle} · ${result.path}`;

export const toPlaygroundResults = (
  results: readonly KnowledgeSearchResult[],
): PlaygroundResultView[] => {
  const maxScore = results.reduce((highest, result) => Math.max(highest, result.score), 0);
  return results.map((result, index) => ({
    key: `${result.documentId}-${result.path}-${index}`,
    sourceKind: result.sourceKind,
    sourceTitle: result.sourceTitle,
    scoreLabel: knowledgeSearchScoreLabel(result.score),
    scorePercent: knowledgeSearchScorePercent(result.score, maxScore),
    text: result.text,
    isLong: isKnowledgeSearchTextLong(result.text),
    location: knowledgeSearchLocation(result),
  }));
};
