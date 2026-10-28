import { KnowledgeFileStatus } from '@/features/knowledge/constants/knowledgeUpload.constants';
import { BadgeTone } from '@/shared/ui/display/Badge';

export const STATUS_TONES: Readonly<Record<KnowledgeFileStatus, BadgeTone>> = {
  [KnowledgeFileStatus.Ready]: BadgeTone.Neutral,
  [KnowledgeFileStatus.Uploading]: BadgeTone.Accent,
  [KnowledgeFileStatus.Uploaded]: BadgeTone.Ok,
  [KnowledgeFileStatus.Failed]: BadgeTone.Err,
  [KnowledgeFileStatus.Skipped]: BadgeTone.Err,
};
