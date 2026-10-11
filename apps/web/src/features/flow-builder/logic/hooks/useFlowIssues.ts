import type { FlowIssue } from '@agent-ic/flow';
import { useMemo } from 'react';
import { currentIssues } from '@/features/flow-builder/logic/helpers/issue.helpers';
import { useFlowBuilderStore } from '@/features/flow-builder/storage/hooks/useFlowBuilderStore';

export function useFlowIssues(): readonly FlowIssue[] {
  const document = useFlowBuilderStore((state) => state.document);
  const saveState = useFlowBuilderStore((state) => state.saveState);
  const issues = useFlowBuilderStore((state) => state.issues);
  return useMemo(() => currentIssues(document, saveState, issues), [document, saveState, issues]);
}
