export interface ReplaceTelegramTokenDialogProps {
  readonly username: string;
  readonly token: string;
  readonly tokenError: string | null;
  readonly busy: boolean;
  readonly error: string | null;
  readonly onTokenChange: (value: string) => void;
  readonly onOpenChange: (open: boolean) => void;
  readonly onCancel: () => void;
  readonly onConfirm: () => void;
}
