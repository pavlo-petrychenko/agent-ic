export interface CloseChatModalProps {
  readonly conversationName: string;
  readonly message: string;
  readonly submitting: boolean;
  readonly error: string | null;
  readonly onMessageChange: (value: string) => void;
  readonly onSubmit: () => void;
  readonly onClose: () => void;
}
