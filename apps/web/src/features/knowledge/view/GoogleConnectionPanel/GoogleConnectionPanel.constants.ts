import { KnowledgeConnectionStatus } from '@/shared/api/generated/schema.generated';
import { BadgeTone } from '@/shared/ui/display/Badge';

export const GOOGLE_CONNECTION_ICON_SIZE = 15;
export const GOOGLE_CONNECTION_SPINNER_SIZE = 14;
export const GOOGLE_CONNECTION_STATUS_TONES: Readonly<
  Record<KnowledgeConnectionStatus, BadgeTone>
> = {
  [KnowledgeConnectionStatus.Active]: BadgeTone.Ok,
  [KnowledgeConnectionStatus.Revoked]: BadgeTone.Err,
  [KnowledgeConnectionStatus.Error]: BadgeTone.Warn,
};
