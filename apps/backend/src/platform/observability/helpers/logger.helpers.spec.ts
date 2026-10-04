import type { IncomingMessage, ServerResponse } from 'node:http';
import { Writable } from 'node:stream';
import { pinoHttp } from 'pino-http';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { EnvVar } from '@/platform/config/constants/env.constants';
import { LogLevel } from '@/platform/config/constants/log-level.constants';
import { loadAppConfig } from '@/platform/config/helpers/config.helpers';
import { HttpHeader } from '@/platform/http/constants/http-header.constants';
import { Role } from '@/platform/module-roles/constants/role.constants';
import { REDACTED_LOG_VALUE } from '@/platform/observability/constants/logger.constants';
import { createHttpLoggerOptions } from '@/platform/observability/helpers/logger.helpers';
import { createTestEnv } from '@test/support/fixtures/test-env.fixture';

const ACCESS_TOKEN = 'access-token-that-must-not-be-logged';
const REQUEST_COOKIE = '__Secure-rt=request-refresh-token-that-must-not-be-logged';
const RESPONSE_COOKIE = '__Secure-rt=response-refresh-token-that-must-not-be-logged';
const LOGGED_PATH = '/api/auth/refresh';

const collectLogs = (): { stream: Writable; output: () => string } => {
  const chunks: string[] = [];
  const stream = new Writable({
    write(chunk: Buffer, _encoding, done): void {
      chunks.push(chunk.toString());
      done();
    },
  });
  return { stream, output: () => chunks.join('') };
};

describe('createHttpLoggerOptions', () => {
  it('keeps tokens and cookies out of the request log', async () => {
    const config = loadAppConfig(
      { role: Role.Api, queues: [] },
      createTestEnv({ [EnvVar.LogLevel]: LogLevel.Info }),
    );
    const logs = collectLogs();
    const logger = pinoHttp(createHttpLoggerOptions(config), logs.stream);

    await request((incoming: IncomingMessage, outgoing: ServerResponse) => {
      logger(incoming, outgoing);
      outgoing.setHeader(HttpHeader.SetCookie, RESPONSE_COOKIE);
      outgoing.end();
    })
      .post(LOGGED_PATH)
      .set(HttpHeader.Authorization, `Bearer ${ACCESS_TOKEN}`)
      .set(HttpHeader.Cookie, REQUEST_COOKIE);

    const output = logs.output();
    expect(output).toContain(LOGGED_PATH);
    expect(output).toContain(REDACTED_LOG_VALUE);
    expect(output).not.toContain(ACCESS_TOKEN);
    expect(output).not.toContain(REQUEST_COOKIE);
    expect(output).not.toContain(RESPONSE_COOKIE);
  });
});
