import { once } from 'node:events';
import { createServer } from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { setTimeout as delay } from 'node:timers/promises';
import { HttpStatus } from '@nestjs/common';
import { OUTBOUND_RESPONSE_MAX_BYTES } from '@/platform/outbound-http/constants/outbound-http.constants';
import {
  OUTBOUND_TEST_FLAKY_FAILURES,
  OUTBOUND_TEST_HEADER,
  OUTBOUND_TEST_HOST,
  OUTBOUND_TEST_SLOW_RESPONSE_MS,
  OUTBOUND_TEST_STATUS,
  OutboundTestPath,
  PROBE_SERVER_ADDRESS,
} from '@test/support/constants/outbound-http-testing.constants';
import { MissingTestDataError } from '@test/support/errors/missing-test-data.error';
import type { ProbeEcho, ProbeServer } from '@test/support/typedefs/outbound-http-testing.typedefs';

const readText = async (request: IncomingMessage): Promise<string> => {
  const chunks: Buffer[] = [];
  for await (const chunk of request) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString();
};

const respond = async (
  request: IncomingMessage,
  response: ServerResponse,
  hits: number,
  released: () => Promise<void>,
): Promise<void> => {
  if (request.url === OutboundTestPath.Held) {
    await released();
  }
  if (request.url === OutboundTestPath.Slow) {
    await delay(OUTBOUND_TEST_SLOW_RESPONSE_MS);
    response.end();
    return;
  }
  if (request.url === OutboundTestPath.Large || request.url === OutboundTestPath.Exact) {
    const factor = request.url === OutboundTestPath.Large ? 2 : 1;
    response.end('x'.repeat(OUTBOUND_RESPONSE_MAX_BYTES * factor));
    return;
  }
  if (
    request.url === OutboundTestPath.Unavailable ||
    (request.url === OutboundTestPath.Flaky && hits <= OUTBOUND_TEST_FLAKY_FAILURES)
  ) {
    response.statusCode = HttpStatus.SERVICE_UNAVAILABLE;
    response.end();
    return;
  }
  const header = request.headers[OUTBOUND_TEST_HEADER];
  const echo: ProbeEcho = {
    method: request.method ?? '',
    header: typeof header === 'string' ? header : null,
    body: await readText(request),
  };
  const succeeds = [OutboundTestPath.Ok, OutboundTestPath.Flaky, OutboundTestPath.Held].some(
    (path) => request.url === path,
  );
  response.statusCode = succeeds ? HttpStatus.OK : OUTBOUND_TEST_STATUS;
  response.end(JSON.stringify(echo));
};

export const startProbeServer = async (): Promise<ProbeServer> => {
  const hits = new Map<string, number>();
  const held: (() => void)[] = [];
  const released = () => new Promise<void>((resolve) => held.push(resolve));
  const server = createServer((request, response) => {
    const path = request.url ?? '';
    const count = (hits.get(path) ?? 0) + 1;
    hits.set(path, count);
    void respond(request, response, count, released);
  });
  server.listen(0, OUTBOUND_TEST_HOST);
  await once(server, 'listening');
  const address = server.address();
  if (address === null || typeof address === 'string') {
    throw new MissingTestDataError(PROBE_SERVER_ADDRESS);
  }
  const { port } = address;
  return {
    origin: `http://${OUTBOUND_TEST_HOST}:${port}`,
    port,
    hits: (path) => hits.get(path) ?? 0,
    release: () => {
      held.splice(0).forEach((resolve) => resolve());
    },
    close: async () => {
      server.closeAllConnections();
      server.close();
      await once(server, 'close');
    },
  };
};
