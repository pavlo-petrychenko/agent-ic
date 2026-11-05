import { useCallback, useMemo, useState } from 'react';
import { useKnowledgeSearch } from '@/features/knowledge/communication/hooks/useKnowledgeSearch';
import { KNOWLEDGE_SEARCH_DEFAULT_TOP_K } from '@/features/knowledge/constants/knowledgeSearch.constants';
import type { KnowledgePlaygroundProps } from '@/features/knowledge/containers/KnowledgePlayground/KnowledgePlayground.typedefs';
import { toPlaygroundResults } from '@/features/knowledge/logic/helpers/knowledgeSearch.helpers';
import { Playground } from '@/features/knowledge/view/Playground';
import { toAppError } from '@/shared/api/helpers/appError.helpers';
import { useErrorMessage } from '@/shared/i18n/hooks/useErrorMessage';

export function KnowledgePlayground({ knowledgeBaseId }: KnowledgePlaygroundProps) {
  const { results, loading, failed, error, searched, search } = useKnowledgeSearch(knowledgeBaseId);
  const [query, setQuery] = useState('');
  const [lastSearch, setLastSearch] = useState<string | null>(null);
  const errorMessage = useErrorMessage();
  const viewResults = useMemo(() => toPlaygroundResults(results), [results]);

  const runSearch = useCallback(
    (value: string) => {
      const trimmed = value.trim();
      if (trimmed.length === 0) {
        return;
      }
      setLastSearch(trimmed);
      void search(trimmed, KNOWLEDGE_SEARCH_DEFAULT_TOP_K);
    },
    [search],
  );

  return (
    <Playground
      query={query}
      canSearch={query.trim().length > 0 && !loading}
      loading={loading}
      searched={searched}
      results={viewResults}
      errorMessage={failed && error !== null ? errorMessage(toAppError(error)) : null}
      onQueryChange={setQuery}
      onSearch={() => runSearch(query)}
      onRetry={() => {
        if (lastSearch !== null) {
          runSearch(lastSearch);
        }
      }}
      onClear={() => setQuery('')}
    />
  );
}
