import type { KnowledgeSourceDocumentView } from '@/features/knowledge/typedefs/knowledgeSource.typedefs';

export interface SummaryEditorDialogProps {
  readonly sourceId: string;
  readonly document: KnowledgeSourceDocumentView;
  readonly onClose: () => void;
}
