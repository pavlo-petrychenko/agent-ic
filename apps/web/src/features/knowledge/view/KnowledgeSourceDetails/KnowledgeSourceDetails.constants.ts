import { KnowledgeDocumentStatus } from '@/features/knowledge/constants/knowledgeDocument.constants';
import { BadgeTone } from '@/shared/ui/display/Badge';

export const DOCUMENT_STATUS_TONES: Readonly<Record<KnowledgeDocumentStatus, BadgeTone>> = {
  [KnowledgeDocumentStatus.Pending]: BadgeTone.Neutral,
  [KnowledgeDocumentStatus.Indexing]: BadgeTone.Accent,
  [KnowledgeDocumentStatus.Indexed]: BadgeTone.Ok,
  [KnowledgeDocumentStatus.Error]: BadgeTone.Err,
  [KnowledgeDocumentStatus.Removed]: BadgeTone.Neutral,
};
