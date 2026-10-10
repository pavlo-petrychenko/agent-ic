import type { FlowIssue } from '@agent-ic/flow';

export interface IssueEntry {
  issue: FlowIssue;
  step: string | null;
}

export interface IssueOverview {
  entries: readonly IssueEntry[];
  errors: number;
  warnings: number;
}
