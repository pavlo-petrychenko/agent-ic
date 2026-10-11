export interface DeleteWorkspaceDialogProps {
  readonly workspaceName: string;
  readonly memberCount: number;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}
