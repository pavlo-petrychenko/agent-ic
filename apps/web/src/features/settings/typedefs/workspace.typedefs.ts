export interface WorkspaceRow {
  readonly id: string;
  readonly name: string;
  readonly initials: string;
  readonly hint: string;
  readonly isCurrent: boolean;
  readonly canLeave: boolean;
}
