import { useCallback, useState } from 'react';
import { usePromptVersion } from '@/features/prompts/communication/hooks/usePromptVersion';
import type {
  PromptComparePair,
  UsePromptCompareResult,
} from '@/features/prompts/containers/PromptPage/PromptPage.typedefs';

export function usePromptCompare(): UsePromptCompareResult {
  const [pair, setPair] = useState<PromptComparePair | null>(null);
  const from = usePromptVersion(pair?.fromId ?? null);
  const to = usePromptVersion(pair?.toId ?? null);
  const fromRetry = from.retry;
  const toRetry = to.retry;

  const begin = useCallback((fromId: string, toId: string) => setPair({ fromId, toId }), []);
  const close = useCallback(() => setPair(null), []);
  const selectFrom = useCallback((versionId: string) => {
    setPair((current) => {
      if (current === null || current.fromId === versionId) {
        return current;
      }
      return current.toId === versionId
        ? { fromId: versionId, toId: current.fromId }
        : { ...current, fromId: versionId };
    });
  }, []);
  const selectTo = useCallback((versionId: string) => {
    setPair((current) => {
      if (current === null || current.toId === versionId) {
        return current;
      }
      return current.fromId === versionId
        ? { fromId: current.toId, toId: versionId }
        : { ...current, toId: versionId };
    });
  }, []);
  const retry = useCallback(
    () => Promise.all([fromRetry(), toRetry()]).then(() => undefined),
    [fromRetry, toRetry],
  );

  return {
    pair,
    begin,
    close,
    selectFrom,
    selectTo,
    from: from.version,
    to: to.version,
    failed: from.failed || to.failed,
    retry,
  };
}
