export interface LeaveWorkspaceDialogProps {
  readonly workspaceId: string;
  readonly workspaceName: string;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}
