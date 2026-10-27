export interface DeleteApiChannelDialogProps {
  readonly channelName: string;
  readonly agentName: string;
  readonly typedName: string;
  readonly confirmed: boolean;
  readonly onTypedNameChange: (value: string) => void;
  readonly onSubmit: () => void;
  readonly onClose: () => void;
}
