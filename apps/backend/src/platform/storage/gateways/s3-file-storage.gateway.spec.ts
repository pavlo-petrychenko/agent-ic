import { createServer } from 'node:http';
import type { IncomingHttpHeaders } from 'node:http';
import type { Server } from 'node:http';
import { buffer } from 'node:stream/consumers';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { EnvVar } from '@/platform/config/constants/env.constants';
import { loadAppConfig } from '@/platform/config/helpers/config.helpers';
import { ConfigService } from '@/platform/config/services/config.service';
import { Role } from '@/platform/module-roles/constants/role.constants';
import { S3FileStorageGateway } from '@/platform/storage/gateways/s3-file-storage.gateway';
import { createTestEnv } from '@test/support/fixtures/test-env.fixture';

const KEY = 'workspaces/workspace-id/knowledge/original.txt';
const BODY = Buffer.from('hello');
const PUBLIC_ORIGIN = 'https://public.storage.test';
const MISSING_KEY = 'workspaces/workspace-id/knowledge/missing.txt';
const COPY_TARGET_KEY = 'workspaces/workspace-id/knowledge/documents/original.txt';
const PREFIX = 'workspaces/workspace-id/knowledge/';
const PREFIX_KEYS = [
  'workspaces/workspace-id/knowledge/uploads/document/original.txt',
  'workspaces/workspace-id/knowledge/documents/document/content-1.md',
];
const EXPIRES_IN_SECONDS = 900;

interface RecordedRequest {
  readonly method: string;
  readonly url: string;
  readonly headers: IncomingHttpHeaders;
  readonly body: Buffer;
}

const listObjectsResponse = (prefix: string, keys: readonly string[]): string =>
  [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<ListBucketResult xmlns="http://s3.amazonaws.com/doc/2006-03-01/">',
    '<Name>agent-ic-test</Name>',
    `<Prefix>${prefix}</Prefix>`,
    `<KeyCount>${keys.length}</KeyCount>`,
    '<MaxKeys>1000</MaxKeys>',
    '<IsTruncated>false</IsTruncated>',
    ...keys.map(
      (key) =>
        `<Contents><Key>${key}</Key><ETag>&quot;etag-1&quot;</ETag><Size>${BODY.length}</Size><LastModified>2026-05-01T09:00:00.000Z</LastModified><StorageClass>STANDARD</StorageClass></Contents>`,
    ),
    '</ListBucketResult>',
  ].join('');

const startServer = async (
  requests: RecordedRequest[],
  prefixObjects: Set<string>,
): Promise<Server> => {
  const server = createServer((request, response) => {
    void (async () => {
      const chunks: Buffer[] = [];
      for await (const chunk of request) {
        chunks.push(Buffer.from(chunk));
      }
      const url = request.url ?? '';
      requests.push({
        method: request.method ?? '',
        url,
        headers: request.headers,
        body: Buffer.concat(chunks),
      });

      if (url.includes('forbidden')) {
        response.writeHead(403);
        response.end();
        return;
      }
      if (url.includes('unavailable')) {
        response.writeHead(503);
        response.end();
        return;
      }
      if (request.method === 'GET' && url.includes('list-type=2')) {
        const prefix = new URL(url, 'http://storage.test').searchParams.get('prefix') ?? '';
        const keys = [...prefixObjects].filter((key) => key.startsWith(prefix));
        response.writeHead(200, { 'Content-Type': 'application/xml' });
        response.end(listObjectsResponse(prefix, keys));
        return;
      }
      if (request.method === 'POST' && url.includes('delete')) {
        const body = Buffer.concat(chunks).toString('utf8');
        for (const match of body.matchAll(/<Key>([^<]+)<\/Key>/g)) {
          prefixObjects.delete(match[1] ?? '');
        }
        response.writeHead(200, { 'Content-Type': 'application/xml' });
        response.end(
          '<DeleteResult xmlns="http://s3.amazonaws.com/doc/2006-03-01/"></DeleteResult>',
        );
        return;
      }
      if (request.method === 'PUT' && request.headers['x-amz-copy-source'] !== undefined) {
        response.writeHead(200, { 'Content-Type': 'application/xml' });
        response.end(
          '<CopyObjectResult><ETag>"etag-1"</ETag><LastModified>2026-05-01T09:00:00.000Z</LastModified></CopyObjectResult>',
        );
        return;
      }
      if (request.method === 'PUT') {
        response.writeHead(200, { ETag: '"etag-1"' });
        response.end();
        return;
      }
      if (request.method === 'HEAD') {
        if (url.includes('missing')) {
          response.writeHead(404);
          response.end();
          return;
        }
        response.writeHead(200, {
          'Content-Length': String(BODY.length),
          'Content-Type': 'text/plain',
          ETag: '"etag-1"',
        });
        response.end();
        return;
      }
      if (request.method === 'GET') {
        response.writeHead(200, { 'Content-Type': 'text/plain' });
        response.end(BODY);
        return;
      }
      if (request.method === 'DELETE') {
        response.writeHead(204);
        response.end();
        return;
      }
      response.writeHead(400);
      response.end();
    })();
  });

  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  return server;
};

const originOf = (server: Server): string => {
  const address = server.address();
  if (address === null || typeof address === 'string') {
    throw new Error('The test S3 server has no TCP address.');
  }
  return `http://127.0.0.1:${address.port}`;
};

const pathOf = (url: string): string => new URL(url, 'http://storage.test').pathname;

describe('S3FileStorageGateway', () => {
  const requests: RecordedRequest[] = [];
  const prefixObjects = new Set<string>();
  let server: Server;
  let storage: S3FileStorageGateway;

  beforeAll(async () => {
    server = await startServer(requests, prefixObjects);
    const config = loadAppConfig(
      { role: Role.Api, queues: [] },
      createTestEnv({
        [EnvVar.S3Endpoint]: originOf(server),
        [EnvVar.S3PublicEndpoint]: PUBLIC_ORIGIN,
      }),
    );
    storage = new S3FileStorageGateway(new ConfigService(config));
  });

  afterAll(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error === undefined ? resolve() : reject(error)));
    });
  });

  beforeEach(() => {
    requests.length = 0;
    prefixObjects.clear();
    for (const key of PREFIX_KEYS) {
      prefixObjects.add(key);
    }
  });

  it('puts an object with its content type', async () => {
    await storage.put(KEY, BODY, 'text/plain');

    expect(requests).toHaveLength(1);
    expect(requests[0]?.method).toBe('PUT');
    expect(pathOf(requests[0]?.url ?? '')).toBe(`/agent-ic-test/${KEY}`);
    expect(requests[0]?.headers['content-type']).toBe('text/plain');
    expect(requests[0]?.body).toEqual(BODY);
  });

  it('heads an object and returns null for a missing one', async () => {
    await expect(storage.head(KEY)).resolves.toEqual({
      key: KEY,
      size: BODY.length,
      contentType: 'text/plain',
      etag: '"etag-1"',
    });
    await expect(storage.head(MISSING_KEY)).resolves.toBeNull();
  });

  it('gets an object as a readable stream', async () => {
    await expect(buffer(await storage.get(KEY))).resolves.toEqual(BODY);
  });

  it('copies an object server-side', async () => {
    await storage.copy(KEY, COPY_TARGET_KEY);

    expect(requests).toHaveLength(1);
    expect(requests[0]?.method).toBe('PUT');
    expect(pathOf(requests[0]?.url ?? '')).toBe(`/agent-ic-test/${COPY_TARGET_KEY}`);
    expect(requests[0]?.headers['x-amz-copy-source']).toBe(`agent-ic-test/${KEY}`);
  });

  it('deletes an object', async () => {
    await storage.delete(KEY);

    expect(requests[0]?.method).toBe('DELETE');
    expect(pathOf(requests[0]?.url ?? '')).toBe(`/agent-ic-test/${KEY}`);
  });

  it('deletes every object under a prefix', async () => {
    await storage.deletePrefix(PREFIX);

    expect(prefixObjects.size).toBe(0);
    const listRequest = requests.find(
      (request) => request.method === 'GET' && request.url.includes('list-type=2'),
    );
    expect(new URL(listRequest?.url ?? '', 'http://storage.test').searchParams.get('prefix')).toBe(
      PREFIX,
    );
    const deleteRequest = requests.find((request) => request.method === 'POST');
    expect(deleteRequest?.body.toString()).toContain(PREFIX_KEYS[0]);
    expect(deleteRequest?.body.toString()).toContain(PREFIX_KEYS[1]);
  });

  it('maps a rejected S3 call to a non-retryable upstream error', async () => {
    await expect(
      storage.put('workspaces/workspace-id/forbidden', BODY, 'text/plain'),
    ).rejects.toMatchObject({
      upstream: 'storage',
      retryable: false,
    });
  });

  it('maps a transient S3 failure to a retryable upstream error', async () => {
    await expect(
      storage.put('workspaces/workspace-id/unavailable', BODY, 'text/plain'),
    ).rejects.toMatchObject({
      upstream: 'storage',
      retryable: true,
    });
  });

  it('presigns upload and download URLs against the public endpoint', async () => {
    const put = new URL(await storage.presignPut(KEY, 'text/plain', EXPIRES_IN_SECONDS));
    const get = new URL(await storage.presignGet(KEY, EXPIRES_IN_SECONDS));

    expect(put.origin).toBe(PUBLIC_ORIGIN);
    expect(get.origin).toBe(PUBLIC_ORIGIN);
    expect(put.pathname).toBe(`/agent-ic-test/${KEY}`);
    expect(get.pathname).toBe(`/agent-ic-test/${KEY}`);
    expect(put.searchParams.get('X-Amz-Signature')).not.toBeNull();
    expect(get.searchParams.get('X-Amz-Signature')).not.toBeNull();
    expect(put.searchParams.get('X-Amz-Expires')).toBe(String(EXPIRES_IN_SECONDS));
  });
});
