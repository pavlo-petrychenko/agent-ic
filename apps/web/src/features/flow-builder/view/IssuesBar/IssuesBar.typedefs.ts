export interface IssueRow {
  id: string;
  message: string;
  step: string | null;
  nodeId: string | null;
}

export interface IssuesBarProps {
  rows: readonly IssueRow[];
  errors: number;
  warnings: number;
  onIssueSelect: (nodeId: string) => void;
}
