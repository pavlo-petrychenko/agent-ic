import type { FlowDocument } from '@flow/document/typedefs/flow.typedefs';
import type { FlowGraph, ScopeLookup } from '@flow/scope/typedefs/scope.typedefs';
import type { FlowIssueCode, FlowIssueSeverity } from '@flow/validation/constants/issue.constants';

export interface ValidationContext {
  readonly flow: FlowDocument;
  readonly graph: FlowGraph;
  readonly reachable: ReadonlySet<string>;
  readonly inBranches: ReadonlySet<string>;
  readonly scope: ScopeLookup;
}

export type FlowIssueParams = Readonly<Record<string, string | number>>;

export interface FlowIssue {
  readonly code: FlowIssueCode;
  readonly severity: FlowIssueSeverity;
  readonly nodeId: string | null;
  readonly edgeId: string | null;
  readonly path: readonly string[];
  readonly params: FlowIssueParams;
}

export interface FlowIssueInput {
  readonly nodeId?: string | null;
  readonly edgeId?: string | null;
  readonly path?: readonly string[];
  readonly params?: FlowIssueParams;
}
