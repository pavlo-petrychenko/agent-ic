import type { AddressInfo } from 'node:net';
import type { INestApplication } from '@nestjs/common';
import type { FormattedExecutionResult } from 'graphql';
import { createClient } from 'graphql-ws';
import WebSocket from 'ws';
import { AppModule } from '@/app/app.module';
import { APP_MODULES } from '@/app/constants/app-modules.constants';
import { createApplication } from '@/app/helpers/application.helpers';
import type { AppConfig } from '@/platform/config/typedefs/app-config.typedefs';
import { GRAPHQL_PATH } from '@/platform/graphql-server/constants/graphql-server.constants';
import { GlobalPrefix } from '@/platform/http/constants/global-prefix.constants';
import type { ModuleImport } from '@/platform/module-roles/typedefs/module-roles.typedefs';
import { TracingService } from '@/platform/observability/services/tracing.service';
import {
  API_ROLE_SELECTION,
  LOOPBACK_HOST,
  WEBSOCKET_NO_RESULT_MESSAGE,
  WEBSOCKET_PROTOCOL,
} from '@test/support/constants/request-layer.constants';
import { TestRedisPrefix } from '@test/support/constants/test-infrastructure.constants';
import { createIntegrationConfig } from '@test/support/fixtures/integration-env.fixture';

export const apiPath = (...segments: readonly string[]): string =>
  [``, GlobalPrefix.Api, ...segments].join('/');

export const graphqlPath = (): string => `/${GlobalPrefix.Api}${GRAPHQL_PATH}`;

export const createApi = async (
  modules: readonly ModuleImport[] = APP_MODULES,
  config: AppConfig = createIntegrationConfig(API_ROLE_SELECTION, TestRedisPrefix.RequestLayer),
): Promise<INestApplication> => {
  const tracing = new TracingService(config.telemetry);
  return createApplication(config, AppModule.forRole(config, tracing, modules));
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
