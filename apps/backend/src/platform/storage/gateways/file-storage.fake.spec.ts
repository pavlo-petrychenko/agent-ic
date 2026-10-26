import { buffer } from 'node:stream/consumers';
import { describe, expect, it } from 'vitest';
import { STORAGE_OBJECT_MISSING_MESSAGE } from '@/platform/storage/constants/storage.constants';
import { FakeFileStorage } from '@/platform/storage/gateways/file-storage.fake';

describe('FakeFileStorage', () => {
  it('stores, reads, heads and deletes an object', async () => {
    const storage = new FakeFileStorage();
    const key = 'workspaces/workspace-id/knowledge/original.txt';

    await storage.put(key, Buffer.from('hello'), 'text/plain');

    await expect(buffer(await storage.get(key))).resolves.toEqual(Buffer.from('hello'));
    await expect(storage.head(key)).resolves.toEqual({
      key,
      size: 5,
      contentType: 'text/plain',
      etag: null,
    });

    await storage.delete(key);

    await expect(storage.head(key)).resolves.toBeNull();
    await expect(storage.get(key)).rejects.toThrow(STORAGE_OBJECT_MISSING_MESSAGE);
  });

  it('copies an object without removing the source', async () => {
    const storage = new FakeFileStorage();
    const source = 'workspaces/workspace-id/knowledge/uploads/document/original.txt';
    const target = 'workspaces/workspace-id/knowledge/documents/document/original.txt';
    await storage.put(source, Buffer.from('hello'), 'text/plain');

    await storage.copy(source, target);

    await expect(storage.head(target)).resolves.toMatchObject({
      size: 5,
      contentType: 'text/plain',
    });
    await expect(storage.head(source)).resolves.not.toBeNull();
  });

  it('records the presigned requests', async () => {
    const storage = new FakeFileStorage();
    const key = 'workspaces/workspace-id/knowledge/original.txt';

    const putUrl = await storage.presignPut(key, 'text/plain', 900);
    const getUrl = await storage.presignGet(key, 60);

    expect(putUrl).toContain(key);
    expect(getUrl).toContain(key);
    expect(storage.presignedPuts).toEqual([
      { key, contentType: 'text/plain', expiresInSeconds: 900 },
    ]);
    expect(storage.presignedGets).toEqual([{ key, expiresInSeconds: 60 }]);
  });
});
