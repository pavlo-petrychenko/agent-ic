import type { KnowledgeSourceSchedule } from '@/features/knowledge/typedefs/knowledgeSource.typedefs';

export interface SourceScheduleFieldProps {
  readonly schedule: KnowledgeSourceSchedule;
  readonly disabled?: boolean;
  readonly onChange: (schedule: KnowledgeSourceSchedule) => void;
}
