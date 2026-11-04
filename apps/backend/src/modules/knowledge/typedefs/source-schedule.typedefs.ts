import type { KnowledgeSyncInterval } from '@/modules/knowledge/constants/knowledge.constants';

export interface KnowledgeScheduleInput {
  readonly syncInterval: KnowledgeSyncInterval | null;
  readonly syncTime: string | null;
  readonly syncWeekday: number | null;
}

export interface SourceScheduleFields {
  readonly syncInterval: KnowledgeSyncInterval | null;
  readonly syncTime: string | null;
  readonly syncWeekday: number | null;
  readonly timezone: string | null;
  readonly nextSyncAt: Date | null;
}
