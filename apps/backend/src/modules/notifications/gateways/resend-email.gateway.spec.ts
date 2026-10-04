import { createServer } from 'node:http';
import type { IncomingMessage, Server, ServerResponse } from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterEach, describe, expect, it } from 'vitest';
import { EmailUpstream } from '@/modules/notifications/constants/email-gateway.constants';
import { ResendEmailGateway } from '@/modules/notifications/gateways/resend-email.gateway';
import type { EmailMessage } from '@/modules/notifications/typedefs/email.typedefs';
import { UpstreamError } from '@/platform/errors/errors/upstream.error';
import { HttpHeader } from '@/platform/http/constants/http-header.constants';

interface ReceivedRequest {
  readonly method: string | undefined;
  readonly authorization: string | undefined;
  readonly body: unknown;
}

const FROM = 'agent-ic <no-reply@agent-ic.test>';
const API_KEY = 're_test_key';
const LOOPBACK = '127.0.0.1';
const MESSAGE: EmailMessage = {
  to: 'olena@agent-ic.test',
  subject: 'Confirm',
  html: '<p>Hi</p>',
  text: 'Hi',
};

const readBody = async (request: IncomingMessage): Promise<unknown> => {
  const chunks: Buffer[] = [];
  for await (const chunk of request) {
    chunks.push(Buffer.from(chunk));
  }
  return JSON.parse(Buffer.concat(chunks).toString());
};

describe('ResendEmailGateway', () => {
  let server: Server | null = null;

  const serve = async (
    status: number,
    received: ReceivedRequest[] = [],
  ): Promise<ResendEmailGateway> => {
    server = createServer((request: IncomingMessage, response: ServerResponse) => {
      void readBody(request).then((body) => {
        received.push({
          method: request.method,
          authorization: request.headers[HttpHeader.Authorization],
          body,
        });
        response.writeHead(status).end();
      });
    });
    await new Promise<void>((resolve) => server?.listen(0, LOOPBACK, resolve));
    const { port } = server.address() as AddressInfo;
    return new ResendEmailGateway(FROM, API_KEY, `http://${LOOPBACK}:${port}/emails`);
  };

  afterEach(async () => {
    await new Promise((resolve) => server?.close(resolve));
    server = null;
  });

  it('posts the message with the api key', async () => {
    const received: ReceivedRequest[] = [];
    const gateway = await serve(200, received);

    await gateway.send(MESSAGE);

    expect(received).toEqual([
      {
        method: 'POST',
        authorization: `Bearer ${API_KEY}`,
        body: { from: FROM, to: [MESSAGE.to], subject: 'Confirm', html: '<p>Hi</p>', text: 'Hi' },
      },
    ]);
  });

  it('fails retryably when Resend is down', async () => {
    const gateway = await serve(503);

    await expect(gateway.send(MESSAGE)).rejects.toMatchObject({
      upstream: EmailUpstream.Resend,
      retryable: true,
    });
  });

  it('gives up when Resend rejects the message', async () => {
    const gateway = await serve(422);

    const attempt = gateway.send(MESSAGE);

    await expect(attempt).rejects.toBeInstanceOf(UpstreamError);
    await expect(attempt).rejects.toMatchObject({ retryable: false });
  });
});
