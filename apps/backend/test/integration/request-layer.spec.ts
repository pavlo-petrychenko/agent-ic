import { ErrorCode, ErrorReason } from '@agent-ic/contracts';
import type { INestApplication } from '@nestjs/common';
import { CloseCode } from 'graphql-ws';
import request from 'supertest';
import { afterEach, describe, expect, it } from 'vitest';
import { APP_MODULES, PLATFORM_MODULES } from '@/app/constants/app-modules.constants';
import { EnvVar } from '@/platform/config/constants/env.constants';
import { PROBLEM_CONTENT_TYPE } from '@/platform/errors/constants/problem-details.constants';
import { ConnectionParam } from '@/platform/graphql-server/constants/connection-param.constants';
import { UnboundResolverError } from '@/platform/graphql-server/errors/unbound-resolver.error';
import { HttpHeader } from '@/platform/http/constants/http-header.constants';
import {
  EPHEMERAL_PORT,
  FailingRoute,
  INVALID_BEARER,
  LOOPBACK_HOST,
  SERVER_STATUS_QUERY,
  UNKNOWN_ROUTE,
} from '@test/support/constants/request-layer.constants';
import { SAMPLE_FIELD_PATH } from '@test/support/constants/sample-errors.constants';
import { TEST_ENV } from '@test/support/constants/test-env.constants';
import {
  apiPath,
  createApi,
  graphqlPath,
  queryOverWebSocket,
} from '@test/support/helpers/request-layer.helpers';
import { FailingApiModule } from '@test/support/modules/failing-api.module';

describe('api request layer', () => {
  let app: INestApplication | null = null;

  const boot = async (): Promise<INestApplication> => {
    app = await createApi([...APP_MODULES, FailingApiModule]);
    await app.init();
    return app;
  };

  afterEach(async () => {
    await app?.close();
    app = null;
  });

  describe('serverStatus', () => {
    it('answers over HTTP', async () => {
      const http = request((await boot()).getHttpServer());

      const response = await http.post(graphqlPath()).send({ query: SERVER_STATUS_QUERY });

      expect(response.status).toBe(200);
      expect(response.body.data.serverStatus).toEqual({
        version: TEST_ENV[EnvVar.AppVersion],
        uptimeSeconds: expect.any(Number),
      });
    });

    it('answers over WebSocket', async () => {
      const started = await boot();
      await started.listen(EPHEMERAL_PORT, LOOPBACK_HOST);

      const result = await queryOverWebSocket(started, SERVER_STATUS_QUERY);

      expect(result.errors).toBeUndefined();
      expect(result.data?.['serverStatus']).toEqual({
        version: TEST_ENV[EnvVar.AppVersion],
        uptimeSeconds: expect.any(Number),
      });
    });

    it('refuses a WebSocket connection with an invalid token', async () => {
      const started = await boot();
      await started.listen(EPHEMERAL_PORT, LOOPBACK_HOST);

      const result = queryOverWebSocket(started, SERVER_STATUS_QUERY, {
        [ConnectionParam.Authorization]: INVALID_BEARER,
      });

      await expect(result).rejects.toMatchObject({ code: CloseCode.Forbidden });
    });
  });

  describe('domain errors', () => {
    it('arrive in GraphQL with the code in extensions', async () => {
      const http = request((await boot()).getHttpServer());

      const response = await http
        .post(graphqlPath())
        .set(HttpHeader.Authorization, INVALID_BEARER)
        .send({ query: SERVER_STATUS_QUERY });

      expect(response.body.errors[0].extensions).toMatchObject({
        code: ErrorCode.Unauthenticated,
        reason: ErrorReason.InvalidAccessToken,
        traceId: expect.any(String),
      });
    });

    it('arrive over REST as problem+json', async () => {
      const http = request((await boot()).getHttpServer());

      const response = await http.get(apiPath(FailingRoute.Base, FailingRoute.Validation));

      expect(response.status).toBe(422);
      expect(response.headers['content-type']).toContain(PROBLEM_CONTENT_TYPE);
      expect(response.body).toMatchObject({
        status: 422,
        code: ErrorCode.BadUserInput,
        reason: ErrorReason.InvalidId,
        instance: apiPath(FailingRoute.Base, FailingRoute.Validation),
        traceId: expect.any(String),
        errors: [{ path: SAMPLE_FIELD_PATH, reason: ErrorReason.InvalidId }],
      });
    });

    it('map a not-found error to 404', async () => {
      const http = request((await boot()).getHttpServer());

      const response = await http.get(apiPath(FailingRoute.Base, FailingRoute.NotFound));

      expect(response.status).toBe(404);
      expect(response.body.code).toBe(ErrorCode.NotFound);
    });

    it('answer an unknown REST route with problem+json', async () => {
      const http = request((await boot()).getHttpServer());

      const response = await http.get(apiPath(UNKNOWN_ROUTE));

      expect(response.status).toBe(404);
      expect(response.headers['content-type']).toContain(PROBLEM_CONTENT_TYPE);
      expect(response.body.reason).toBe(ErrorReason.RouteNotFound);
    });
  });

  it('fails to boot when a root field has no resolver', async () => {
    app = await createApi(PLATFORM_MODULES);

    await expect(app.init()).rejects.toBeInstanceOf(UnboundResolverError);
  });
});
