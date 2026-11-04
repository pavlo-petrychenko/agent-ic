import type { KnowledgeSourceSchedule } from '@/features/knowledge/typedefs/knowledgeSource.typedefs';

export interface SourceScheduleModalProps {
  readonly title: string;
  readonly description: string;
  readonly submitLabel: string;
  readonly schedule: KnowledgeSourceSchedule;
  readonly submitting: boolean;
  readonly error: string | null;
  readonly onChange: (schedule: KnowledgeSourceSchedule) => void;
  readonly onSubmit: () => void;
  readonly onClose: () => void;
}
