import { HttpStatus } from '@nestjs/common';
import {
  GOOGLE_DRIVE_RETRYABLE_403_REASONS,
  GOOGLE_DRIVE_UPSTREAM,
} from '@/modules/knowledge/constants/google-drive.constants';
import { KnowledgeDocumentStaleReason } from '@/modules/knowledge/constants/knowledge.constants';
import {
  GoogleDriveExportTooLargeError,
  GoogleDriveFileRemovedError,
  GoogleDriveFileUnavailableError,
} from '@/modules/knowledge/errors/google-drive.error';
import { GoogleReconnectRequiredError } from '@/modules/knowledge/errors/google-reconnect-required.error';
import { googleDriveErrorSchema } from '@/modules/knowledge/schemas/google-drive.schema';
import { UpstreamError } from '@/platform/errors/errors/upstream.error';

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
    const reason = googleDriveErrorReason(body);
    if (reason === GOOGLE_DRIVE_EXPORT_SIZE_LIMIT_REASON) {
      return new GoogleDriveExportTooLargeError();
    }
    if (reason !== null && GOOGLE_DRIVE_RETRYABLE_403_REASONS.has(reason)) {
      return new UpstreamError(GOOGLE_DRIVE_UPSTREAM, {
        retryable: true,
        cause: new Error(reason),
      });
    }
    return new GoogleDriveFileUnavailableError();
  }
  if (status === HttpStatus.NOT_FOUND) {
    return new GoogleDriveFileRemovedError(KnowledgeDocumentStaleReason.Missing);
  }
  if (status === HttpStatus.GONE) {
    return new GoogleDriveFileRemovedError(KnowledgeDocumentStaleReason.Gone);
  }
  return null;
};
