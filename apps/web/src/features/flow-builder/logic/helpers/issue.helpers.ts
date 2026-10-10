import { FlowIssueSeverity, validateFlow } from '@agent-ic/flow';
import type { FlowDocument, FlowIssue } from '@agent-ic/flow';
import { SaveState } from '@/features/flow-builder/constants/saveState.constants';
import type { IssueOverview } from '@/features/flow-builder/typedefs/issue.typedefs';

const localIssues = new WeakMap<FlowDocument, readonly FlowIssue[]>();

const validateOnce = (document: FlowDocument): readonly FlowIssue[] => {
  const cached = localIssues.get(document);
  if (cached !== undefined) {
    return cached;
  }
  const issues = validateFlow(document);
  localIssues.set(document, issues);
  return issues;
};

export const currentIssues = (
  document: FlowDocument,
  saveState: SaveState,
  savedIssues: readonly FlowIssue[],
): readonly FlowIssue[] => (saveState === SaveState.Idle ? savedIssues : validateOnce(document));

export const isBlocking = (issue: FlowIssue): boolean => issue.severity === FlowIssueSeverity.Error;

export const overviewIssues = (
  document: FlowDocument,
  issues: readonly FlowIssue[],
): IssueOverview => {
  const steps = new Map(
    document.nodes.map((node) => [node.id, node.label === '' ? node.key : node.label]),
  );
  const errors = issues.filter(isBlocking);
  const warnings = issues.filter((issue) => !isBlocking(issue));
  return {
    entries: [...errors, ...warnings].map((issue) => ({
      issue,
      step: issue.nodeId === null ? null : (steps.get(issue.nodeId) ?? null),
    })),
    errors: errors.length,
    warnings: warnings.length,
  };
};
