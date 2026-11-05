export interface CloseChatDialogProps {
  readonly conversationId: string;
  readonly conversationName: string;
  readonly onClose: () => void;
  readonly onClosed: () => void;
}
