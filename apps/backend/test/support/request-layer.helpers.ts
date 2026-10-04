import type { AddressInfo } from 'node:net';

import type { INestApplication, Type } from '@nestjs/common';
import { createClient } from 'graphql-ws';
import type { FormattedExecutionResult } from 'graphql';
import WebSocket from 'ws';

import { ApplicationFactory } from '@/entrypoints/application.factory';
import { CliOption, Role } from '@/platform/config/config.constants';
import { ConfigLoader } from '@/platform/config/config.loader';
import { GRAPHQL_PATH } from '@/platform/graphql/graphql.constants';
import { GlobalPrefix } from '@/platform/http/http.constants';
import { TracingService } from '@/platform/observability/tracing/tracing.service';
import { createIntegrationTestEnv } from '@/platform/testing/integration-env.fixture';
import { TestRedisDatabase } from '@/platform/testing/test-infrastructure.constants';
import { cliArgument, createArgv } from '@/platform/testing/test-env.fixture';

import {
  LOOPBACK_HOST,
  WEBSOCKET_NO_RESULT_MESSAGE,
  WEBSOCKET_PROTOCOL,
} from './request-layer.constants';

export const apiPath = (...segments: readonly string[]): string =>
  [``, GlobalPrefix.Api, ...segments].join('/');

export const graphqlPath = (): string => `/${GlobalPrefix.Api}${GRAPHQL_PATH}`;

export const createApi = async (
  module: Type<unknown>,
  env: NodeJS.ProcessEnv = createIntegrationTestEnv(TestRedisDatabase.RequestLayer),
): Promise<INestApplication> => {
  const config = new ConfigLoader(env).load(createArgv(cliArgument(CliOption.Role, Role.Api)));
  return new ApplicationFactory(config, new TracingService(config.telemetry), {
    module,
    globalPrefix: GlobalPrefix.Api,
  }).create();
};

const websocketUrl = (app: INestApplication): string => {
  const { port } = app.getHttpServer().address() as AddressInfo;
  const url = new URL(graphqlPath(), `http://${LOOPBACK_HOST}:${port}`);
  url.protocol = WEBSOCKET_PROTOCOL;
  return url.toString();
};

export const queryOverWebSocket = async (
  app: INestApplication,
  query: string,
  connectionParams: Record<string, string> = {},
): Promise<FormattedExecutionResult<Record<string, unknown>, unknown>> => {
  const client = createClient({
    url: websocketUrl(app),
    webSocketImpl: WebSocket,
    connectionParams,
    retryAttempts: 0,
    lazy: true,
  });
  try {
    const result = await client.iterate({ query }).next();
    if (result.done === true) {
      throw new Error(WEBSOCKET_NO_RESULT_MESSAGE);
    }
    return result.value;
  } finally {
    await client.dispose();
  }
};
