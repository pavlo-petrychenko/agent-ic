import type { KnowledgeSource } from '@/features/knowledge/typedefs/knowledgeSource.typedefs';

export interface UpdateSourceScheduleDialogProps {
  readonly knowledgeBaseId: string;
  readonly source: KnowledgeSource;
  readonly onClose: () => void;
}
