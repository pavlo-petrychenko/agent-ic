export interface DisconnectTelegramBotDialogProps {
  readonly username: string;
  readonly agent: string;
  readonly apiChannelName: string | null;
  readonly busy: boolean;
  readonly error: string | null;
  readonly onOpenChange: (open: boolean) => void;
  readonly onCancel: () => void;
  readonly onConfirm: () => void;
}
