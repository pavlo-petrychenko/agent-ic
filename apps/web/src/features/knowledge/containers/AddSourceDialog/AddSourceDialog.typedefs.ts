export interface AddSourceDialogProps {
  readonly knowledgeBaseName: string;
  readonly onClose: () => void;
  readonly onAddFiles?: (files: readonly File[]) => void;
}
