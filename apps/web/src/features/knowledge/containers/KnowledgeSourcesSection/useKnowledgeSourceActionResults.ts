import { useCallback, useEffect, useRef, useState } from 'react';
import { KnowledgeSourceStatus } from '@/features/knowledge/constants/knowledgeSource.constants';
import { isKnowledgeSourceActive } from '@/features/knowledge/logic/helpers/knowledgeSource.helpers';
import type {
  KnowledgeSource,
  KnowledgeSourceAction,
  KnowledgeSourceActionResult,
  KnowledgeSourceTarget,
} from '@/features/knowledge/typedefs/knowledgeSource.typedefs';

interface PendingAction {
  readonly action: KnowledgeSourceAction;
  readonly updatedAt: string | null;
  active: boolean;
}

export function useKnowledgeSourceActionResults(
  sources: readonly KnowledgeSource[],
  onResult: (result: KnowledgeSourceActionResult) => void,
): (source: KnowledgeSourceTarget, action: KnowledgeSourceAction) => () => void {
  const pending = useRef(new Map<string, PendingAction>());
  const onResultRef = useRef(onResult);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);

  useEffect(() => {
    for (const [sourceId, pendingAction] of pending.current) {
      const source = sources.find((candidate) => candidate.id === sourceId);
      if (source === undefined) {
        pending.current.delete(sourceId);
        continue;
      }
      if (isKnowledgeSourceActive(source.status)) {
        pendingAction.active = true;
        continue;
      }
      if (!pendingAction.active && source.updatedAt === pendingAction.updatedAt) {
        continue;
      }
      pending.current.delete(sourceId);
      onResultRef.current({
        action: pendingAction.action,
        source,
        succeeded: source.status === KnowledgeSourceStatus.Ready,
      });
    }
  }, [sources, version]);

  return useCallback(
    (source: KnowledgeSourceTarget, action: KnowledgeSourceAction) => {
      const current = sources.find((candidate) => candidate.id === source.id);
      pending.current.set(source.id, {
        action,
        updatedAt: current?.updatedAt ?? null,
        active: false,
      });
      setVersion((currentVersion) => currentVersion + 1);
      return () => {
        pending.current.delete(source.id);
        setVersion((currentVersion) => currentVersion + 1);
      };
    },
    [sources],
  );
}
