export interface ApiSecretKeyDialogProps {
  readonly channelName: string;
  readonly secret: string;
  readonly webhookSecret: string;
  readonly endpoint: string;
  readonly onOpenChange: (open: boolean) => void;
  readonly onCopy: () => void;
  readonly onCopyWebhook: () => void;
  readonly onDone: () => void;
}
