export interface RemoveLlmKeyDialogProps {
  readonly provider: string;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onConfirm: () => void;
}
