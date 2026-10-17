export interface DeletePromptModalProps {
  readonly promptName: string;
  readonly submitting: boolean;
  readonly error: string | null;
  readonly onSubmit: () => void;
  readonly onClose: () => void;
}
