export interface DeleteTelegramBotDialogProps {
  readonly channelName: string;
  readonly typedName: string;
  readonly confirmed: boolean;
  readonly busy: boolean;
  readonly error: string | null;
  readonly onTypedNameChange: (value: string) => void;
  readonly onOpenChange: (open: boolean) => void;
  readonly onCancel: () => void;
  readonly onSubmit: () => void;
}
