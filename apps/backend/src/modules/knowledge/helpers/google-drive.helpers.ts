import { HttpStatus } from '@nestjs/common';
import { KnowledgeDocumentStaleReason } from '@/modules/knowledge/constants/knowledge.constants';
import {
  GoogleDriveExportTooLargeError,
  GoogleDriveFileRemovedError,
  GoogleDriveFileUnavailableError,
} from '@/modules/knowledge/errors/google-drive.error';
import { GoogleReconnectRequiredError } from '@/modules/knowledge/errors/google-reconnect-required.error';
import { googleDriveErrorSchema } from '@/modules/knowledge/schemas/google-drive.schema';

const GOOGLE_DRIVE_EXPORT_SIZE_LIMIT_REASON = 'exportSizeLimitExceeded';

const googleDriveErrorReason = (body: string | null): string | null => {
  if (body === null) {
    return null;
  }
  let value: unknown;
  try {
    value = JSON.parse(body);
  } catch {
    return null;
  }
  const parsed = googleDriveErrorSchema.safeParse(value);
  return parsed.success ? (parsed.data.error.errors?.[0]?.reason ?? null) : null;
};

export const googleDriveFileErrorForStatus = (
  status: number,
  body: string | null,
): Error | null => {
  if (status === HttpStatus.UNAUTHORIZED) {
    return new GoogleReconnectRequiredError();
  }
  if (status === HttpStatus.FORBIDDEN) {
    return googleDriveErrorReason(body) === GOOGLE_DRIVE_EXPORT_SIZE_LIMIT_REASON
      ? new GoogleDriveExportTooLargeError()
      : new GoogleDriveFileUnavailableError();
  }
  if (status === HttpStatus.NOT_FOUND) {
    return new GoogleDriveFileRemovedError(KnowledgeDocumentStaleReason.Missing);
  }
  if (status === HttpStatus.GONE) {
    return new GoogleDriveFileRemovedError(KnowledgeDocumentStaleReason.Gone);
  }
  return null;
};
