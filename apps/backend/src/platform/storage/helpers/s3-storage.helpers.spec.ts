import { S3ServiceException } from '@aws-sdk/client-s3';
import type { HeadObjectCommandOutput } from '@aws-sdk/client-s3';
import { describe, expect, it } from 'vitest';
import {
  isMissingS3Object,
  storedObjectFromHead,
} from '@/platform/storage/helpers/s3-storage.helpers';

const serviceException = (name: string, status: number): S3ServiceException =>
  new S3ServiceException({
    name,
    $fault: 'client',
    $metadata: { httpStatusCode: status },
    message: name,
  });

describe('isMissingS3Object', () => {
  it('recognizes a missing object by its status or its name', () => {
    expect(isMissingS3Object(serviceException('NotFound', 404))).toBe(true);
    expect(isMissingS3Object(serviceException('NoSuchKey', 400))).toBe(true);
  });

  it('keeps every other failure', () => {
    expect(isMissingS3Object(serviceException('AccessDenied', 403))).toBe(false);
    expect(isMissingS3Object(new Error('network'))).toBe(false);
  });
});

describe('storedObjectFromHead', () => {
  it('keeps the size, content type and etag', () => {
    const output: HeadObjectCommandOutput = {
      $metadata: {},
      ContentLength: 12,
      ContentType: 'application/pdf',
      ETag: '"etag"',
    };

    expect(storedObjectFromHead('documents/file.pdf', output)).toEqual({
      key: 'documents/file.pdf',
      size: 12,
      contentType: 'application/pdf',
      etag: '"etag"',
    });
  });

  it('fills the optional metadata', () => {
    const output: HeadObjectCommandOutput = { $metadata: {} };

    expect(storedObjectFromHead('documents/file.pdf', output)).toEqual({
      key: 'documents/file.pdf',
      size: 0,
      contentType: null,
      etag: null,
    });
  });
});
