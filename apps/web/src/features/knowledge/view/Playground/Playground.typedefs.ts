import type { PlaygroundResultView } from '@/features/knowledge/typedefs/knowledgeSearch.typedefs';

export interface PlaygroundProps {
  readonly query: string;
  readonly topK: number;
  readonly canSearch: boolean;
  readonly loading: boolean;
  readonly searched: boolean;
  readonly results: readonly PlaygroundResultView[];
  readonly errorMessage: string | null;
  readonly onQueryChange: (query: string) => void;
  readonly onTopKChange: (topK: number) => void;
  readonly onSearch: () => void;
  readonly onRetry: () => void;
  readonly onClear: () => void;
}
