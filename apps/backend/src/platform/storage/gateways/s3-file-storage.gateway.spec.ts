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
const EXPIRES_IN_SECONDS = 900;

interface RecordedRequest {
  readonly method: string;
  readonly url: string;
  readonly headers: IncomingHttpHeaders;
  readonly body: Buffer;
}

const startServer = async (requests: RecordedRequest[]): Promise<Server> => {
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
  let server: Server;
  let storage: S3FileStorageGateway;

  beforeAll(async () => {
    server = await startServer(requests);
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

  it('deletes an object', async () => {
    await storage.delete(KEY);

    expect(requests[0]?.method).toBe('DELETE');
    expect(pathOf(requests[0]?.url ?? '')).toBe(`/agent-ic-test/${KEY}`);
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
