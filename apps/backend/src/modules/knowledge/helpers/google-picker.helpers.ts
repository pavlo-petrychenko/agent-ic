import {
  KNOWLEDGE_DOCUMENT_TITLE_MAX_LENGTH,
  KNOWLEDGE_SOURCE_TITLE_MAX_LENGTH,
} from '@agent-ic/contracts';
import {
  GOOGLE_DRIVE_DEFAULT_VERSION,
  GOOGLE_PICKER_SOURCE_TITLE_PREFIX,
} from '@/modules/knowledge/constants/google-drive.constants';
import type { GoogleDriveFile } from '@/modules/knowledge/typedefs/google-drive.typedefs';

const truncated = (value: string, maxLength: number): string =>
  value.length <= maxLength ? value : value.slice(0, maxLength).trimEnd();

export const googleDocsDocumentTitle = (file: GoogleDriveFile): string =>
  truncated(file.name, KNOWLEDGE_DOCUMENT_TITLE_MAX_LENGTH);

export const googleDocsSourceTitleFromNames = (names: readonly string[]): string => {
  const first = names[0];
  if (first === undefined) {
    return GOOGLE_PICKER_SOURCE_TITLE_PREFIX;
  }
  const title =
    names.length === 1 ? first : `${GOOGLE_PICKER_SOURCE_TITLE_PREFIX} (${names.length})`;
  return truncated(title, KNOWLEDGE_SOURCE_TITLE_MAX_LENGTH);
};

export const googleDocsSourceTitleAfterRemoval = (
  sourceTitle: string,
  previousNames: readonly string[],
  remainingNames: readonly string[],
): string | null =>
  sourceTitle === googleDocsSourceTitleFromNames(previousNames)
    ? googleDocsSourceTitleFromNames(remainingNames)
    : null;

export const googleDriveVersion = (file: GoogleDriveFile): string =>
  (file.version ?? file.modifiedTime ?? GOOGLE_DRIVE_DEFAULT_VERSION).replace(
    /[^a-zA-Z0-9._-]/g,
    '-',
  );

export const googleDriveDate = (value: string | null): Date | null => {
  if (value === null) {
    return null;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};
