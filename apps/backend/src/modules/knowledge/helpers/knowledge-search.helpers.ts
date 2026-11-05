import {
  KNOWLEDGE_SEARCH_BM25_WEIGHT,
  KNOWLEDGE_SEARCH_RESULT_LIMIT,
  KNOWLEDGE_SEARCH_RRF_K,
  KNOWLEDGE_SEARCH_TERM_LIMIT,
  KNOWLEDGE_SEARCH_TEXT_MAX_LENGTH,
  KNOWLEDGE_SEARCH_TOKEN_LIMIT,
  KNOWLEDGE_SEARCH_TRIGRAM_WEIGHT,
  KNOWLEDGE_SEARCH_VECTOR_WEIGHT,
} from '@/modules/knowledge/constants/knowledge-search.constants';
import { bm25Tokens } from '@/modules/knowledge/helpers/bm25.helpers';
import type {
  KnowledgeSearchCandidate,
  KnowledgeSearchLists,
  KnowledgeSearchText,
  KnowledgeSectionMatch,
} from '@/modules/knowledge/typedefs/knowledge-search.typedefs';

interface WeightedList {
  readonly candidates: readonly KnowledgeSearchCandidate[];
  readonly weight: number;
}

interface SectionScore {
  readonly candidate: KnowledgeSearchCandidate;
  readonly score: number;
  readonly bestContribution: number;
}

const WEIGHTED_LISTS = (lists: KnowledgeSearchLists): readonly WeightedList[] => [
  { candidates: lists.vector, weight: KNOWLEDGE_SEARCH_VECTOR_WEIGHT },
  { candidates: lists.bm25, weight: KNOWLEDGE_SEARCH_BM25_WEIGHT },
  { candidates: lists.trigram, weight: KNOWLEDGE_SEARCH_TRIGRAM_WEIGHT },
];

export const knowledgeQueryTerms = (query: string): string[] => {
  const terms = new Set<string>();
  for (const term of bm25Tokens(query.trim())) {
    if (terms.size >= KNOWLEDGE_SEARCH_TERM_LIMIT) {
      break;
    }
    terms.add(term);
  }
  return [...terms];
};

export const knowledgeRrfScore = (rank: number, weight: number): number =>
  weight / (KNOWLEDGE_SEARCH_RRF_K + rank);

const bestPerSection = (
  candidates: readonly KnowledgeSearchCandidate[],
  weight: number,
): ReadonlyMap<string, SectionScore> => {
  const best = new Map<string, SectionScore>();
  const contributions = new Map<string, number>();
  candidates.forEach((candidate, index) => {
    const contribution = knowledgeRrfScore(index + 1, weight);
    const current = contributions.get(candidate.sectionId);
    if (current === undefined || contribution > current) {
      contributions.set(candidate.sectionId, contribution);
      best.set(candidate.sectionId, {
        candidate,
        score: contribution,
        bestContribution: contribution,
      });
    }
  });
  return best;
};

export const fuseKnowledgeSearch = (lists: KnowledgeSearchLists): KnowledgeSectionMatch[] => {
  const scores = new Map<string, SectionScore>();
  for (const list of WEIGHTED_LISTS(lists)) {
    for (const [sectionId, sectionScore] of bestPerSection(list.candidates, list.weight)) {
      const current = scores.get(sectionId);
      const betterCandidate =
        current === undefined || sectionScore.bestContribution > current.bestContribution;
      scores.set(sectionId, {
        candidate: betterCandidate
          ? sectionScore.candidate
          : (current?.candidate ?? sectionScore.candidate),
        bestContribution: Math.max(current?.bestContribution ?? 0, sectionScore.bestContribution),
        score: (current?.score ?? 0) + sectionScore.score,
      });
    }
  }
  return [...scores.entries()]
    .map(([sectionId, { candidate, score }]): KnowledgeSectionMatch => ({
      sectionId,
      score,
      candidate,
    }))
    .sort(
      (left, right) => right.score - left.score || left.sectionId.localeCompare(right.sectionId),
    );
};

export const truncateKnowledgeSearchText = (text: string): string =>
  text.length <= KNOWLEDGE_SEARCH_TEXT_MAX_LENGTH
    ? text
    : `${text.slice(0, KNOWLEDGE_SEARCH_TEXT_MAX_LENGTH).trimEnd()}…`;

export const selectKnowledgeHits = (
  matches: readonly KnowledgeSectionMatch[],
  texts: ReadonlyMap<string, KnowledgeSearchText>,
  limit: number = KNOWLEDGE_SEARCH_RESULT_LIMIT,
  tokenLimit: number = KNOWLEDGE_SEARCH_TOKEN_LIMIT,
): KnowledgeSectionMatch[] => {
  const hits: KnowledgeSectionMatch[] = [];
  let tokens = 0;
  for (const match of matches) {
    if (hits.length >= limit) {
      break;
    }
    const text = texts.get(match.sectionId);
    if (text === undefined) {
      continue;
    }
    if (hits.length > 0 && tokens + text.tokenCount > tokenLimit) {
      continue;
    }
    hits.push(match);
    tokens += text.tokenCount;
  }
  return hits;
};
