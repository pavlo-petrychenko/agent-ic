import type { FlowDocument, FlowIssue } from '@agent-ic/flow';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { FLOW_BUILDER_NAMESPACE } from '@/features/flow-builder/constants/flowBuilderI18n.constants';
import { isBlocking, stepNameOf } from '@/features/flow-builder/logic/helpers/issue.helpers';
import type { IssueText } from '@/features/flow-builder/typedefs/issueText.typedefs';

export function useBlockingIssueTexts(
  issues: readonly FlowIssue[],
  document: FlowDocument | null,
): readonly IssueText[] {
  const { t } = useTranslation(FLOW_BUILDER_NAMESPACE);
  return useMemo(() => {
    const steps = new Map((document?.nodes ?? []).map((node) => [node.id, stepNameOf(node)]));
    return issues.filter(isBlocking).map((issue, index) => ({
      id: String(index),
      nodeId: issue.nodeId,
      step: issue.nodeId === null ? null : (steps.get(issue.nodeId) ?? null),
      message: t(`issue.${issue.code}`, { ...issue.params }),
    }));
  }, [issues, document, t]);
}
