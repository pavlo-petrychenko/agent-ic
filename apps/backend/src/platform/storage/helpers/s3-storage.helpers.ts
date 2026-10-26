import { S3ServiceException } from '@aws-sdk/client-s3';
import type { HeadObjectCommandOutput } from '@aws-sdk/client-s3';
import { UpstreamError } from '@/platform/errors/errors/upstream.error';
import {
  S3_OBJECT_NOT_FOUND_NAMES,
  S3_OBJECT_NOT_FOUND_STATUS,
  STORAGE_UPSTREAM,
} from '@/platform/storage/constants/storage.constants';
import type { StoredObject } from '@/platform/storage/typedefs/storage.typedefs';

export const s3CopySource = (bucket: string, key: string): string =>
  `${bucket}/${key.split('/').map(encodeURIComponent).join('/')}`;

export const storageUpstreamError = (error: unknown): UpstreamError => {
  if (error instanceof UpstreamError) {
    return error;
  }
  const status = error instanceof S3ServiceException ? error.$metadata.httpStatusCode : undefined;
  return status === undefined
    ? new UpstreamError(STORAGE_UPSTREAM, { retryable: true, cause: error })
    : UpstreamError.fromStatus(STORAGE_UPSTREAM, status, error);
};

export const isMissingS3Object = (error: unknown): boolean =>
  error instanceof S3ServiceException &&
  (error.$metadata.httpStatusCode === S3_OBJECT_NOT_FOUND_STATUS ||
    S3_OBJECT_NOT_FOUND_NAMES.has(error.name));

export const storedObjectFromHead = (
  key: string,
  output: HeadObjectCommandOutput,
): StoredObject => ({
  key,
  size: output.ContentLength ?? 0,
  contentType: output.ContentType ?? null,
  etag: output.ETag ?? null,
});
