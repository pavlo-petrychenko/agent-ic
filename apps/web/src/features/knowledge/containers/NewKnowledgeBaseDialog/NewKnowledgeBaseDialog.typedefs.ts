export interface NewKnowledgeBaseDialogProps {
  readonly onClose: () => void;
  readonly onCreated: (knowledgeBaseId: string) => void;
}
