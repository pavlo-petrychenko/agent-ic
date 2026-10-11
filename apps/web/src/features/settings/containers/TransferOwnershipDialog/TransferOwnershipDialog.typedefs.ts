export interface TransferOwnershipDialogProps {
  readonly workspaceName: string;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}
