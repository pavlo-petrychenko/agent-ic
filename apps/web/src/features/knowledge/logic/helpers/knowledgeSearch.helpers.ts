import {
  KNOWLEDGE_SEARCH_SCORE_PRECISION,
  KNOWLEDGE_SEARCH_TEXT_PREVIEW_LENGTH,
} from '@/features/knowledge/constants/knowledgeSearch.constants';
import type {
  KnowledgeSearchResult,
  PlaygroundResultView,
} from '@/features/knowledge/typedefs/knowledgeSearch.typedefs';

const EMPTY_LIST_ITEM_PATTERN = /^\s*[*+-]\s*$/;
const LIST_ITEM_PATTERN = /^(\s*)[*+-]\s+(?=\S)/;
const BOLD_PATTERN = /\*\*(.+?)\*\*/g;
const ITALIC_PATTERN = /\*([^*\n]+)\*/g;
const MARKDOWN_ESCAPE_PATTERN = /\\([$*_])/g;
const EXCESS_BLANK_LINES_PATTERN = /\n{3,}/g;

export const knowledgeSearchScorePercent = (score: number, maxScore: number): number =>
  maxScore <= 0 ? 0 : Math.min(100, Math.max(0, (score / maxScore) * 100));

export const knowledgeSearchScoreLabel = (score: number, maxScore: number): string =>
  (knowledgeSearchScorePercent(score, maxScore) / 100).toFixed(KNOWLEDGE_SEARCH_SCORE_PRECISION);

export const knowledgeSearchPreviewText = (text: string): string =>
  text
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .filter((line) => !EMPTY_LIST_ITEM_PATTERN.test(line))
    .map((line) => line.replace(LIST_ITEM_PATTERN, '$1• '))
    .join('\n')
    .replace(BOLD_PATTERN, '$1')
    .replace(ITALIC_PATTERN, '$1')
    .replace(MARKDOWN_ESCAPE_PATTERN, '$1')
    .replace(EXCESS_BLANK_LINES_PATTERN, '\n\n')
    .trim();

export const isKnowledgeSearchTextLong = (text: string): boolean =>
  text.length > KNOWLEDGE_SEARCH_TEXT_PREVIEW_LENGTH;

export const toPlaygroundResults = (
  results: readonly KnowledgeSearchResult[],
): PlaygroundResultView[] => {
  const maxScore = results.reduce((highest, result) => Math.max(highest, result.score), 0);
  return results.map((result, index) => {
    const text = knowledgeSearchPreviewText(result.text);
    return {
      key: `${result.documentId}-${result.path}-${index}`,
      sourceTitle: result.sourceTitle,
      scoreLabel: knowledgeSearchScoreLabel(result.score, maxScore),
      scorePercent: knowledgeSearchScorePercent(result.score, maxScore),
      text,
      isLong: isKnowledgeSearchTextLong(text),
    };
  });
};
