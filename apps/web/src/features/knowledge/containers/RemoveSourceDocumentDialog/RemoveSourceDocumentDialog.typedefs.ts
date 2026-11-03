import type { KnowledgeSourceDocumentView } from '@/features/knowledge/typedefs/knowledgeSource.typedefs';

export interface RemoveSourceDocumentDialogProps {
  readonly knowledgeBaseId: string;
  readonly sourceId: string;
  readonly sourceName: string;
  readonly document: KnowledgeSourceDocumentView;
  readonly onRemoved: () => void;
  readonly onClose: () => void;
}
