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

export const googleDocsSourceTitle = (files: readonly GoogleDriveFile[]): string => {
  const first = files[0];
  if (first === undefined) {
    return GOOGLE_PICKER_SOURCE_TITLE_PREFIX;
  }
  const title =
    files.length === 1 ? first.name : `${GOOGLE_PICKER_SOURCE_TITLE_PREFIX} (${files.length})`;
  return truncated(title, KNOWLEDGE_SOURCE_TITLE_MAX_LENGTH);
};

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
