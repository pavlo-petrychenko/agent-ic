import { HttpStatus } from '@nestjs/common';
import type { INestApplication } from '@nestjs/common';
import { buildSchema, getIntrospectionQuery } from 'graphql';
import type { GraphQLSchema } from 'graphql';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { APP_MODULES } from '@/app/constants/app-modules.constants';
import { QUERY_LIMIT_ERROR_CODE } from '@/platform/graphql-server/constants/query-limits.constants';
import { queryLimitErrors } from '@/platform/graphql-server/helpers/query-limits.helpers';
import { printMergedSchema } from '@/platform/graphql-server/helpers/schema-print.helpers';
import {
  API_ROLE_SELECTION,
  EPHEMERAL_PORT,
  LOOPBACK_HOST,
} from '@test/support/constants/request-layer.constants';
import { TestRedisPrefix } from '@test/support/constants/test-infrastructure.constants';
import { createIntegrationConfig } from '@test/support/fixtures/integration-env.fixture';
import {
  overComplexQuery,
  placeholderVariables,
  webOperations,
} from '@test/support/helpers/graphql-query-limits.helpers';
import {
  createApi,
  graphqlPath,
  queryOverWebSocket,
} from '@test/support/helpers/request-layer.helpers';

const refusal = [
  expect.objectContaining({
    extensions: expect.objectContaining({ code: QUERY_LIMIT_ERROR_CODE }),
  }),
];

describe('graphql query limits', () => {
  describe('the operations of the web app', () => {
    let schema: GraphQLSchema;

    beforeAll(async () => {
      schema = buildSchema(await printMergedSchema());
    });

    it.each(webOperations())('$name stays within the depth and complexity limits', (web) => {
      const errors = queryLimitErrors({
        schema,
        document: web.document,
        variables: placeholderVariables(schema, web.operation),
        operationName: web.operation.name?.value ?? null,
      });

      expect(
        errors.map((error) => ({ message: error.message, details: error.extensions['details'] })),
      ).toEqual([]);
    });
  });

  describe('through the api', () => {
    let app: INestApplication;

    beforeAll(async () => {
      app = await createApi(
        APP_MODULES,
        createIntegrationConfig(API_ROLE_SELECTION, TestRedisPrefix.QueryLimits),
      );
      await app.init();
      await app.listen(EPHEMERAL_PORT, LOOPBACK_HOST);
    });

    afterAll(async () => {
      await app.close();
    });

    it('refuses a query over the complexity limit over HTTP', async () => {
      const response = await request(app.getHttpServer())
        .post(graphqlPath())
        .send({ query: overComplexQuery() });

      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
      expect(response.body.errors).toEqual(refusal);
    });

    it('refuses a query over the complexity limit over WebSocket', async () => {
      await expect(queryOverWebSocket(app, overComplexQuery())).rejects.toEqual(refusal);
    });

    it('still answers the introspection query', async () => {
      const response = await request(app.getHttpServer())
        .post(graphqlPath())
        .send({ query: getIntrospectionQuery() });

      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body.errors).toBeUndefined();
      expect(response.body.data.__schema.types.length).toBeGreaterThan(0);
    });
  });
});
