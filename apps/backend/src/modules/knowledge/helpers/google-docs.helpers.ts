import { googleDriveDate } from '@/modules/knowledge/helpers/google-picker.helpers';
import type { Document } from '@/modules/knowledge/typedefs/document.typedefs';
import type { GoogleDriveFile } from '@/modules/knowledge/typedefs/google-drive.typedefs';

const sameDate = (left: Date | null, right: Date | null): boolean =>
  left === null ? right === null : right !== null && left.getTime() === right.getTime();

export const googleDocsProviderUnchanged = (document: Document, file: GoogleDriveFile): boolean => {
  if (
    document.activeGeneration === 0 ||
    document.contentStorageKey === null ||
    document.contentHash === null
  ) {
    return false;
  }
  const versionKnown = document.providerVersion !== null || file.version !== null;
  const modifiedKnown = document.providerModifiedAt !== null || file.modifiedTime !== null;
  if (!versionKnown && !modifiedKnown) {
    return false;
  }
  return (
    document.providerVersion === file.version &&
    sameDate(document.providerModifiedAt, googleDriveDate(file.modifiedTime))
  );
};
