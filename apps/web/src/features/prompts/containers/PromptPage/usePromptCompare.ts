import { useCallback, useState } from 'react';
import { usePromptVersion } from '@/features/prompts/communication/hooks/usePromptVersion';
import type { UsePromptCompareResult } from '@/features/prompts/containers/PromptPage/PromptPage.typedefs';

interface ComparePair {
  readonly fromId: string;
  readonly toId: string;
}

export function usePromptCompare(): UsePromptCompareResult {
  const [pair, setPair] = useState<ComparePair | null>(null);
  const from = usePromptVersion(pair?.fromId ?? null);
  const to = usePromptVersion(pair?.toId ?? null);
  const fromRetry = from.retry;
  const toRetry = to.retry;

  const begin = useCallback((fromId: string, toId: string) => setPair({ fromId, toId }), []);
  const close = useCallback(() => setPair(null), []);
  const retry = useCallback(
    () => Promise.all([fromRetry(), toRetry()]).then(() => undefined),
    [fromRetry, toRetry],
  );

  return {
    open: pair !== null,
    begin,
    close,
    from: from.version,
    to: to.version,
    loading: (from.loading || to.loading) && (from.version === null || to.version === null),
    failed: from.failed || to.failed,
    retry,
  };
}
