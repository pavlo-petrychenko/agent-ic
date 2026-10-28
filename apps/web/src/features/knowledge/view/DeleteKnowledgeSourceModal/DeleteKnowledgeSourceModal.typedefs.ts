export interface DeleteKnowledgeSourceModalProps {
  readonly sourceName: string;
  readonly submitting: boolean;
  readonly error: string | null;
  readonly onSubmit: () => void;
  readonly onClose: () => void;
}
