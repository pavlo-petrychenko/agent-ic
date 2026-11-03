import { useCallback, useMemo, useState } from 'react';
import { useKnowledgeSearch } from '@/features/knowledge/communication/hooks/useKnowledgeSearch';
import { KNOWLEDGE_SEARCH_DEFAULT_TOP_K } from '@/features/knowledge/constants/knowledgeSearch.constants';
import type { KnowledgePlaygroundProps } from '@/features/knowledge/containers/KnowledgePlayground/KnowledgePlayground.typedefs';
import { toPlaygroundResults } from '@/features/knowledge/logic/helpers/knowledgeSearch.helpers';
import { Playground } from '@/features/knowledge/view/Playground';
import { toAppError } from '@/shared/api/helpers/appError.helpers';
import { useErrorMessage } from '@/shared/i18n/hooks/useErrorMessage';

interface SearchRequest {
  readonly query: string;
  readonly topK: number;
}

export function KnowledgePlayground({ knowledgeBaseId }: KnowledgePlaygroundProps) {
  const { results, loading, failed, error, searched, search } = useKnowledgeSearch(knowledgeBaseId);
  const [query, setQuery] = useState('');
  const [topK, setTopK] = useState(KNOWLEDGE_SEARCH_DEFAULT_TOP_K);
  const [lastSearch, setLastSearch] = useState<SearchRequest | null>(null);
  const errorMessage = useErrorMessage();
  const viewResults = useMemo(() => toPlaygroundResults(results), [results]);

  const runSearch = useCallback(
    (value: string, count: number) => {
      const trimmed = value.trim();
      if (trimmed.length === 0) {
        return;
      }
      setLastSearch({ query: trimmed, topK: count });
      void search(trimmed, count);
    },
    [search],
  );

  return (
    <Playground
      query={query}
      topK={topK}
      canSearch={query.trim().length > 0 && !loading}
      loading={loading}
      searched={searched}
      results={viewResults}
      errorMessage={failed && error !== null ? errorMessage(toAppError(error)) : null}
      onQueryChange={setQuery}
      onTopKChange={setTopK}
      onSearch={() => runSearch(query, topK)}
      onRetry={() => {
        if (lastSearch !== null) {
          runSearch(lastSearch.query, lastSearch.topK);
        }
      }}
      onClear={() => setQuery('')}
    />
  );
}
