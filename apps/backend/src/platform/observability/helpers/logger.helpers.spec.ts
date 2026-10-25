import type { IncomingMessage, ServerResponse } from 'node:http';
import { Writable } from 'node:stream';
import { trace } from '@opentelemetry/api';
import { node } from '@opentelemetry/sdk-node';
import { CLS_ID, ClsServiceManager } from 'nestjs-cls';
import type { ClsService } from 'nestjs-cls';
import { pinoHttp } from 'pino-http';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { EnvVar } from '@/platform/config/constants/env.constants';
import { LogLevel } from '@/platform/config/constants/log-level.constants';
import { loadAppConfig } from '@/platform/config/helpers/config.helpers';
import type { AppConfig } from '@/platform/config/typedefs/app-config.typedefs';
import { HttpHeader } from '@/platform/http/constants/http-header.constants';
import { Role } from '@/platform/module-roles/constants/role.constants';
import {
  LogContextField,
  REDACTED_LOG_VALUE,
} from '@/platform/observability/constants/logger.constants';
import { redactUrlQuery } from '@/platform/observability/helpers/log-serializers.helpers';
import {
  createHttpLoggerOptions,
  createLogMixin,
} from '@/platform/observability/helpers/logger.helpers';
import { LogContextService } from '@/platform/observability/services/log-context.service';
import { createTestEnv } from '@test/support/fixtures/test-env.fixture';

const ACCESS_TOKEN = 'access-token-that-must-not-be-logged';
const REQUEST_COOKIE = '__Secure-rt=request-refresh-token-that-must-not-be-logged';
const RESPONSE_COOKIE = '__Secure-rt=response-refresh-token-that-must-not-be-logged';
const LOGGED_PATH = '/api/auth/refresh';

const logContextFor = (): { cls: ClsService; logContext: LogContextService } => {
  return { cls: ClsServiceManager.getClsService(), logContext: new LogContextService() };
};

const loadConfig = (): AppConfig =>
  loadAppConfig(
    { role: Role.Api, queues: [] },
    createTestEnv({ [EnvVar.LogLevel]: LogLevel.Info }),
  );

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
    const logger = pinoHttp(
      createHttpLoggerOptions(config, logContextFor().logContext),
      logs.stream,
    );

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

const TRACER_NAME = 'logger-spec';
const REQUEST_ID = 'request-trace-id';
const WORKSPACE_ID = 'workspace-1';
const RUN_ID = 'run-1';
const CONVERSATION_ID = 'conversation-1';
const SENSITIVE_TOKEN = 'query-token-that-must-not-be-logged';
const SENSITIVE_PATH = `/api/auth/confirm?token=${SENSITIVE_TOKEN}&lang=en`;

describe('createLogMixin', () => {
  const provider = new node.NodeTracerProvider();

  const inSpan = <R>(work: () => R): { result: R; traceId: string; spanId: string } =>
    provider.getTracer(TRACER_NAME).startActiveSpan('work', (span) => {
      try {
        const { traceId, spanId } = span.spanContext();
        return { result: work(), traceId, spanId };
      } finally {
        span.end();
      }
    });

  beforeAll(() => {
    provider.register();
  });

  afterAll(async () => {
    await provider.shutdown();
    trace.disable();
  });

  it('adds the trace and span ids of the active span', () => {
    const { logContext } = logContextFor();
    const mixin = createLogMixin(logContext);

    const { result, traceId, spanId } = inSpan(() => mixin());

    expect(result).toEqual({ traceId, spanId });
  });

  it('falls back to the request id when no span is active', () => {
    const { cls, logContext } = logContextFor();
    const mixin = createLogMixin(logContext);

    const fields = cls.run(() => {
      cls.set(CLS_ID, REQUEST_ID);
      return mixin();
    });

    expect(fields).toEqual({ traceId: REQUEST_ID });
  });

  it('prefers the active span over the request id', () => {
    const { cls, logContext } = logContextFor();
    const mixin = createLogMixin(logContext);

    const { result, traceId } = cls.run(() => {
      cls.set(CLS_ID, REQUEST_ID);
      return inSpan(() => mixin());
    });

    expect(result.traceId).toBe(traceId);
  });

  it('adds nothing outside any context', () => {
    const { logContext } = logContextFor();

    expect(createLogMixin(logContext)()).toEqual({});
  });

  it('adds the workspace, run and conversation ids of the log context', () => {
    const { cls, logContext } = logContextFor();
    const mixin = createLogMixin(logContext);

    const fields = cls.run(() => {
      cls.set(CLS_ID, REQUEST_ID);
      logContext.assign({ [LogContextField.WorkspaceId]: WORKSPACE_ID });
      logContext.assign({
        [LogContextField.RunId]: RUN_ID,
        [LogContextField.ConversationId]: CONVERSATION_ID,
      });
      return mixin();
    });

    expect(fields).toEqual({
      traceId: REQUEST_ID,
      workspaceId: WORKSPACE_ID,
      runId: RUN_ID,
      conversationId: CONVERSATION_ID,
    });
  });

  it('ignores assignments made outside a context', () => {
    const { logContext } = logContextFor();

    logContext.assign({ [LogContextField.RunId]: RUN_ID });

    expect(logContext.fields()).toEqual({});
  });
});

describe('log serializers', () => {
  it('keeps only the type, message, stack and code of an error', () => {
    class UpstreamFailure extends Error {
      readonly code = 'E_UPSTREAM';
      readonly requestBodyValues = { prompt: 'prompt that must not be logged' };
      readonly responseBody = 'response that must not be logged';
    }

    const logs = collectLogs();
    const logger = pinoHttp(
      createHttpLoggerOptions(loadConfig(), logContextFor().logContext),
      logs.stream,
    );
    logger.logger.error({ err: new UpstreamFailure('upstream failed') });

    const entry = JSON.parse(logs.output()) as { err: Record<string, unknown> };
    expect(Object.keys(entry.err).sort()).toEqual(['code', 'message', 'stack', 'type']);
    expect(entry.err.message).toBe('upstream failed');
    expect(logs.output()).not.toContain('must not be logged');
  });

  it('masks sensitive query values of a request url', () => {
    expect(redactUrlQuery(SENSITIVE_PATH)).toBe(
      `/api/auth/confirm?token=${REDACTED_LOG_VALUE}&lang=en`,
    );
  });

  it('keeps tokens out of the logged request', async () => {
    const logs = collectLogs();
    const logger = pinoHttp(
      createHttpLoggerOptions(loadConfig(), logContextFor().logContext),
      logs.stream,
    );

    await request((incoming: IncomingMessage, outgoing: ServerResponse) => {
      logger(incoming, outgoing);
      outgoing.end();
    })
      .post(SENSITIVE_PATH)
      .set(HttpHeader.TelegramSecretToken, SENSITIVE_TOKEN);

    expect(logs.output()).toContain('/api/auth/confirm');
    expect(logs.output()).not.toContain(SENSITIVE_TOKEN);
  });
});
