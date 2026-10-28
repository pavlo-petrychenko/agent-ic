import type { Readable } from 'node:stream';
import type { StoredObject } from '@/platform/storage/typedefs/storage.typedefs';

export abstract class FileStorage {
  abstract put(key: string, body: Buffer, contentType: string): Promise<void>;

  abstract get(key: string): Promise<Readable>;

  abstract head(key: string): Promise<StoredObject | null>;

  abstract delete(key: string): Promise<void>;

  abstract deletePrefix(prefix: string): Promise<void>;

  abstract copy(sourceKey: string, targetKey: string): Promise<void>;

  abstract presignPut(key: string, contentType: string, expiresInSeconds: number): Promise<string>;

  abstract presignGet(key: string, expiresInSeconds: number): Promise<string>;
}
