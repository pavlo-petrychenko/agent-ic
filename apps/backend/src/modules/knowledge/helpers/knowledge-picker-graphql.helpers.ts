import { GooglePickerSkipReason } from '@/modules/knowledge/constants/google-drive.constants';
import { KnowledgeSyncInterval } from '@/modules/knowledge/constants/knowledge.constants';
import type {
  CreateGoogleDocsSourceInput,
  GooglePickerSkippedDocument,
} from '@/modules/knowledge/typedefs/google-picker.typedefs';
import {
  GooglePickerSkipReason as GraphqlGooglePickerSkipReason,
  KnowledgeSyncInterval as GraphqlKnowledgeSyncInterval,
  type CreateGoogleDocsSourceInput as GraphqlCreateGoogleDocsSourceInput,
  type GooglePickerSkippedDocument as GraphqlGooglePickerSkippedDocument,
} from '@/platform/graphql-server/generated/schema.generated';

const KNOWLEDGE_SYNC_INTERVAL: Readonly<
  Record<GraphqlKnowledgeSyncInterval, KnowledgeSyncInterval>
> = {
  [GraphqlKnowledgeSyncInterval.Hourly]: KnowledgeSyncInterval.Hourly,
  [GraphqlKnowledgeSyncInterval.Daily]: KnowledgeSyncInterval.Daily,
  [GraphqlKnowledgeSyncInterval.Weekly]: KnowledgeSyncInterval.Weekly,
};

const SKIP_REASON: Readonly<Record<GooglePickerSkipReason, GraphqlGooglePickerSkipReason>> = {
  [GooglePickerSkipReason.Unavailable]: GraphqlGooglePickerSkipReason.Unavailable,
  [GooglePickerSkipReason.Unsupported]: GraphqlGooglePickerSkipReason.Unsupported,
  [GooglePickerSkipReason.Trashed]: GraphqlGooglePickerSkipReason.Trashed,
  [GooglePickerSkipReason.AlreadyAdded]: GraphqlGooglePickerSkipReason.AlreadyAdded,
};

export const toGraphqlGooglePickerSkippedDocument = (
  document: GooglePickerSkippedDocument,
): GraphqlGooglePickerSkippedDocument => ({
  id: document.id,
  name: document.name,
  reason: SKIP_REASON[document.reason],
});

export const toGraphqlGooglePickerSkippedDocuments = (
  documents: readonly GooglePickerSkippedDocument[],
): GraphqlGooglePickerSkippedDocument[] => documents.map(toGraphqlGooglePickerSkippedDocument);

export const toCreateGoogleDocsSourceInput = (
  input: GraphqlCreateGoogleDocsSourceInput,
): CreateGoogleDocsSourceInput => ({
  knowledgeBaseId: input.knowledgeBaseId,
  connectionId: input.connectionId,
  documents: input.documents,
  syncInterval: input.syncInterval === null ? null : KNOWLEDGE_SYNC_INTERVAL[input.syncInterval],
  syncTime: input.syncTime ?? null,
  syncWeekday: input.syncWeekday ?? null,
});
