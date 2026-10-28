import { GooglePickerSkipReason } from '@/modules/knowledge/constants/google-drive.constants';
import type { GooglePickerSkippedDocument } from '@/modules/knowledge/typedefs/google-picker.typedefs';
import {
  GooglePickerSkipReason as GraphqlGooglePickerSkipReason,
  type GooglePickerSkippedDocument as GraphqlGooglePickerSkippedDocument,
} from '@/platform/graphql-server/generated/schema.generated';

const SKIP_REASON: Readonly<Record<GooglePickerSkipReason, GraphqlGooglePickerSkipReason>> = {
  [GooglePickerSkipReason.Unavailable]: GraphqlGooglePickerSkipReason.Unavailable,
  [GooglePickerSkipReason.Unsupported]: GraphqlGooglePickerSkipReason.Unsupported,
  [GooglePickerSkipReason.Trashed]: GraphqlGooglePickerSkipReason.Trashed,
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
