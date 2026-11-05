import type { GooglePickerSkipReason } from '@/modules/knowledge/constants/google-drive.constants';
import type { KnowledgeSyncInterval } from '@/modules/knowledge/constants/knowledge.constants';
import type { KnowledgeSourceView } from '@/modules/knowledge/typedefs/source.typedefs';

export interface GooglePickerSessionResult {
  readonly accessToken: string;
  readonly apiKey: string;
  readonly appId: string;
  readonly expiresAt: Date;
}

export interface GooglePickedDocument {
  readonly id: string;
  readonly name: string;
  readonly mimeType: string;
  readonly url: string | null;
  readonly resourceKey: string | null;
}

export interface GooglePickerSkippedDocument {
  readonly id: string;
  readonly name: string;
  readonly reason: GooglePickerSkipReason;
}

export interface CreateGoogleDocsSourceInput {
  readonly knowledgeBaseId: string;
  readonly connectionId: string;
  readonly documents: readonly GooglePickedDocument[];
  readonly syncInterval?: KnowledgeSyncInterval | null;
  readonly syncTime?: string | null;
  readonly syncWeekday?: number | null;
}

export interface CreateGoogleDocsSourceResult {
  readonly source: KnowledgeSourceView;
  readonly skipped: readonly GooglePickerSkippedDocument[];
}
