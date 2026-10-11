import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { FLOW_BUILDER_NAMESPACE } from '@/features/flow-builder/constants/flowBuilderI18n.constants';
import { overviewIssues } from '@/features/flow-builder/logic/helpers/issue.helpers';
import { useFlowIssues } from '@/features/flow-builder/logic/hooks/useFlowIssues';
import { useFlowBuilderStore } from '@/features/flow-builder/storage/hooks/useFlowBuilderStore';
import { IssuesBar } from '@/features/flow-builder/view/IssuesBar';

export function IssuesPanel() {
  const { t } = useTranslation(FLOW_BUILDER_NAMESPACE);
  const document = useFlowBuilderStore((state) => state.document);
  const select = useFlowBuilderStore((state) => state.select);
  const issues = useFlowIssues();
  const overview = useMemo(() => overviewIssues(document, issues), [document, issues]);

  return (
    <IssuesBar
      errors={overview.errors}
      warnings={overview.warnings}
      rows={overview.entries.map(({ issue, step }, index) => ({
        id: String(index),
        message: t(`issue.${issue.code}`, { ...issue.params }),
        step,
        nodeId: issue.nodeId,
      }))}
      onIssueSelect={(nodeId) => select({ nodeIds: [nodeId], edgeIds: [] })}
    />
  );
}
