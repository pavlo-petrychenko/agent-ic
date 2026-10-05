import { FlowIssueSeverity, WARNING_CODES } from '@flow/validation/constants/issue.constants';
import type { FlowIssueCode } from '@flow/validation/constants/issue.constants';
import type { FlowIssue, FlowIssueInput } from '@flow/validation/typedefs/validation.typedefs';

export const issueSeverity = (code: FlowIssueCode): FlowIssueSeverity =>
  WARNING_CODES.includes(code) ? FlowIssueSeverity.Warning : FlowIssueSeverity.Error;

export const createIssue = (code: FlowIssueCode, input: FlowIssueInput = {}): FlowIssue => ({
  code,
  severity: issueSeverity(code),
  nodeId: input.nodeId ?? null,
  edgeId: input.edgeId ?? null,
  path: input.path ?? [],
  params: input.params ?? {},
});

export const duplicates = <T>(items: readonly T[], keyOf: (item: T) => string): T[] => {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = keyOf(item);
    if (seen.has(key)) {
      return true;
    }
    seen.add(key);
    return false;
  });
};
