import type { ApolloDriverConfig } from '@nestjs/apollo';
import { Injectable } from '@nestjs/common';
import { GraphQLSchemaHost } from '@nestjs/graphql';
import type { GqlOptionsFactory } from '@nestjs/graphql';
import type { Request } from 'express';
import { NodeEnvironment } from '@/platform/config/constants/env.constants';
import { ConfigService } from '@/platform/config/services/config.service';
import {
  clientAddressOf,
  transportRequestFromHttp,
} from '@/platform/context/helpers/transport-request.helpers';
import { TraceIdService } from '@/platform/context/services/trace-id.service';
import { UseCaseCtxService } from '@/platform/context/services/use-case-ctx.service';
import type { TransportRequest } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { DomainError } from '@/platform/errors/errors/domain.error';
import { toGraphqlError } from '@/platform/errors/helpers/graphql-error.helpers';
import { ErrorReporterService } from '@/platform/errors/services/error-reporter.service';
import { ConnectionParam } from '@/platform/graphql-server/constants/connection-param.constants';
import { GRAPHQL_PATH } from '@/platform/graphql-server/constants/graphql-server.constants';
import {
  GraphqlScalar,
  JSON_SCALAR_TYPE_DEFS,
} from '@/platform/graphql-server/constants/scalar.constants';
import { readConnectionParam } from '@/platform/graphql-server/helpers/connection-param.helpers';
import { graphqlMetricsPlugin } from '@/platform/graphql-server/helpers/graphql-metrics.helpers';
import { jsonScalar } from '@/platform/graphql-server/helpers/json-scalar.helpers';
import { moduleTypePaths } from '@/platform/graphql-server/helpers/module-sdl.helpers';
import {
  queryLimitsPlugin,
  subscriptionErrors,
} from '@/platform/graphql-server/helpers/query-limits.helpers';
import { GraphqlLoadersService } from '@/platform/graphql-server/services/graphql-loaders.service';
import { GraphqlMetricsService } from '@/platform/graphql-server/services/graphql-metrics.service';
import type {
  GraphqlContext,
  GraphqlContextInput,
  WebSocketConnectionInput,
  WebSocketContextInput,
} from '@/platform/graphql-server/typedefs/graphql-context.typedefs';
import { HttpHeader } from '@/platform/http/constants/http-header.constants';

@Injectable()
export class GraphqlOptionsService implements GqlOptionsFactory<ApolloDriverConfig> {
  constructor(
    private readonly config: ConfigService,
    private readonly contexts: UseCaseCtxService,
    private readonly traceIds: TraceIdService,
    private readonly reporter: ErrorReporterService,
    private readonly loaders: GraphqlLoadersService,
    private readonly graphqlMetrics: GraphqlMetricsService,
    private readonly schemaHost: GraphQLSchemaHost,
  ) {}

  createGqlOptions(): ApolloDriverConfig {
    const { nodeEnv } = this.config.config;
    return {
      typePaths: moduleTypePaths(),
      typeDefs: JSON_SCALAR_TYPE_DEFS,
      resolvers: { [GraphqlScalar.Json]: jsonScalar },
      path: GRAPHQL_PATH,
      useGlobalPrefix: true,
      graphiql: nodeEnv === NodeEnvironment.Development,
      introspection: nodeEnv !== NodeEnvironment.Production,
      includeStacktraceInErrorResponses: false,
      plugins: [queryLimitsPlugin, graphqlMetricsPlugin(this.graphqlMetrics)],
      subscriptions: {
        'graphql-ws': {
          path: GRAPHQL_PATH,
          onConnect: (connection: WebSocketConnectionInput) => this.acceptConnection(connection),
          onDisconnect: () => this.graphqlMetrics.connectionClosed(),
          onSubscribe: (_connection, _id, payload) =>
            subscriptionErrors(this.schemaHost.schema, payload),
        },
      },
      context: (input: GraphqlContextInput) => this.createContext(input),
    };
  }

  private async createContext(input: GraphqlContextInput): Promise<GraphqlContext> {
    const request = 'req' in input ? this.fromHttp(input.req) : this.fromWebSocket(input);
    try {
      const ctx = await this.contexts.create(request);
      return { ctx, loaders: this.loaders.create(ctx) };
    } catch (error) {
      this.reporter.report(error, request.traceId);
      throw toGraphqlError(error, request.traceId);
    }
  }

  private async acceptConnection(connection: WebSocketConnectionInput): Promise<boolean> {
    try {
      await this.contexts.resolveActor(
        readConnectionParam(connection.connectionParams, ConnectionParam.Authorization),
      );
      this.graphqlMetrics.connectionOpened();
      return true;
    } catch (error) {
      this.reporter.report(error, this.traceIds.current());
      if (error instanceof DomainError) {
        return false;
      }
      throw error;
    }
  }

  private fromHttp(request: Request): TransportRequest {
    return transportRequestFromHttp(request, this.traceIds.current());
  }

  private fromWebSocket(context: WebSocketContextInput): TransportRequest {
    return {
      authorization: readConnectionParam(context.connectionParams, ConnectionParam.Authorization),
      acceptLanguage: context.extra.request.headers[HttpHeader.AcceptLanguage] ?? null,
      workspaceId: readConnectionParam(context.connectionParams, ConnectionParam.WorkspaceId),
      traceId: this.traceIds.current(),
      clientIp: clientAddressOf(context.extra.request),
    };
  }
}
