import { Readable } from 'node:stream';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@/platform/config/services/config.service';
import { STORAGE_UNREADABLE_BODY_MESSAGE } from '@/platform/storage/constants/storage.constants';
import { FileStorage } from '@/platform/storage/gateways/file-storage.gateway';
import {
  isMissingS3Object,
  storedObjectFromHead,
} from '@/platform/storage/helpers/s3-storage.helpers';
import type { StoredObject } from '@/platform/storage/typedefs/storage.typedefs';

@Injectable()
export class S3FileStorageGateway extends FileStorage {
  private readonly internal: S3Client;
  private readonly public: S3Client;
  private readonly bucket: string;

  constructor(config: ConfigService) {
    super();
    const storage = config.config.storage;
    const options = {
      region: storage.region,
      forcePathStyle: storage.forcePathStyle,
      credentials: {
        accessKeyId: storage.accessKeyId,
        secretAccessKey: storage.secretAccessKey,
      },
    };
    this.internal = new S3Client({ ...options, endpoint: storage.endpoint });
    this.public = new S3Client({ ...options, endpoint: storage.publicEndpoint });
    this.bucket = storage.bucket;
  }

  async put(key: string, body: Buffer, contentType: string): Promise<void> {
    await this.internal.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
      }),
    );
  }

  async get(key: string): Promise<Readable> {
    const output = await this.internal.send(
      new GetObjectCommand({ Bucket: this.bucket, Key: key }),
    );
    if (!(output.Body instanceof Readable)) {
      throw new Error(STORAGE_UNREADABLE_BODY_MESSAGE);
    }
    return output.Body;
  }

  async head(key: string): Promise<StoredObject | null> {
    try {
      const output = await this.internal.send(
        new HeadObjectCommand({ Bucket: this.bucket, Key: key }),
      );
      return storedObjectFromHead(key, output);
    } catch (error) {
      if (isMissingS3Object(error)) {
        return null;
      }
      throw error;
    }
  }

  async delete(key: string): Promise<void> {
    await this.internal.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }

  async presignPut(key: string, contentType: string, expiresInSeconds: number): Promise<string> {
    return getSignedUrl(
      this.public,
      new PutObjectCommand({ Bucket: this.bucket, Key: key, ContentType: contentType }),
      { expiresIn: expiresInSeconds },
    );
  }

  async presignGet(key: string, expiresInSeconds: number): Promise<string> {
    return getSignedUrl(this.public, new GetObjectCommand({ Bucket: this.bucket, Key: key }), {
      expiresIn: expiresInSeconds,
    });
  }
}
