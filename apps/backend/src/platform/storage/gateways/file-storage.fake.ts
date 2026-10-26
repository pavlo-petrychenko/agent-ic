import { Readable } from 'node:stream';
import { STORAGE_OBJECT_MISSING_MESSAGE } from '@/platform/storage/constants/storage.constants';
import { FileStorage } from '@/platform/storage/gateways/file-storage.gateway';
import type {
  PresignedGetRequest,
  PresignedPutRequest,
  StoredObject,
} from '@/platform/storage/typedefs/storage.typedefs';

const FAKE_STORAGE_ORIGIN = 'https://storage.test';

export class FakeFileStorage extends FileStorage {
  readonly objects = new Map<string, { readonly body: Buffer; readonly contentType: string }>();
  readonly presignedPuts: PresignedPutRequest[] = [];
  readonly presignedGets: PresignedGetRequest[] = [];

  async put(key: string, body: Buffer, contentType: string): Promise<void> {
    this.objects.set(key, { body: Buffer.from(body), contentType });
  }

  async get(key: string): Promise<Readable> {
    const object = this.objects.get(key);
    if (object === undefined) {
      throw new Error(STORAGE_OBJECT_MISSING_MESSAGE);
    }
    return Readable.from(object.body);
  }

  async head(key: string): Promise<StoredObject | null> {
    const object = this.objects.get(key);
    if (object === undefined) {
      return null;
    }
    return {
      key,
      size: object.body.length,
      contentType: object.contentType,
      etag: null,
    };
  }

  async delete(key: string): Promise<void> {
    this.objects.delete(key);
  }

  async presignPut(key: string, contentType: string, expiresInSeconds: number): Promise<string> {
    this.presignedPuts.push({ key, contentType, expiresInSeconds });
    return `${FAKE_STORAGE_ORIGIN}/${key}?expires=${expiresInSeconds}`;
  }

  async presignGet(key: string, expiresInSeconds: number): Promise<string> {
    this.presignedGets.push({ key, expiresInSeconds });
    return `${FAKE_STORAGE_ORIGIN}/${key}?expires=${expiresInSeconds}`;
  }
}
