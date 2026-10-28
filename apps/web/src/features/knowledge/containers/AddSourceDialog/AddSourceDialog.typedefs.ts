export interface AddSourceDialogProps {
  readonly knowledgeBaseId: string;
  readonly knowledgeBaseName: string;
  readonly onClose: () => void;
  readonly onUploaded: () => void;
}
