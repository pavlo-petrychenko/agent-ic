import { KnowledgeSourceStatus } from '@/features/knowledge/constants/knowledgeSource.constants';
import { BadgeTone } from '@/shared/ui/display/Badge';

export const STATUS_TONES: Readonly<Record<KnowledgeSourceStatus, BadgeTone>> = {
  [KnowledgeSourceStatus.Pending]: BadgeTone.Neutral,
  [KnowledgeSourceStatus.Indexing]: BadgeTone.Accent,
  [KnowledgeSourceStatus.Ready]: BadgeTone.Ok,
  [KnowledgeSourceStatus.Error]: BadgeTone.Err,
};
