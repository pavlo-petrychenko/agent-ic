export interface DeleteKnowledgeBaseModalProps {
  readonly knowledgeBaseName: string;
  readonly submitting: boolean;
  readonly error: string | null;
  readonly onSubmit: () => void;
  readonly onClose: () => void;
}
