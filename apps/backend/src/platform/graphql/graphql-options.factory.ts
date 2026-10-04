import type { ApolloDriverConfig } from '@nestjs/apollo';
import { Injectable } from '@nestjs/common';
import type { GqlOptionsFactory } from '@nestjs/graphql';
import type { Request } from 'express';
import { NodeEnvironment } from '@/platform/config/constants/env.constants';
import { ConfigService } from '@/platform/config/services/config.service';
import { TraceIdService } from '@/platform/context/services/trace-id.service';
import { UseCaseCtxService } from '@/platform/context/services/use-case-ctx.service';
import type { TransportRequest } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { DomainError } from '@/platform/errors/errors/domain.error';
import { toGraphqlError } from '@/platform/errors/helpers/graphql-error.helpers';
import { ErrorReporterService } from '@/platform/errors/services/error-reporter.service';
import { ConnectionParam, GRAPHQL_PATH } from '@/platform/graphql/graphql.constants';
import { moduleTypePaths, readConnectionParam } from '@/platform/graphql/graphql.helpers';
import type {
  GraphqlContext,
  GraphqlContextInput,
  WebSocketConnectionInput,
  WebSocketContextInput,
} from '@/platform/graphql/graphql.typedefs';
import { HttpHeader } from '@/platform/http/constants/http-header.constants';

@Injectable()
export class GraphqlOptionsFactory implements GqlOptionsFactory<ApolloDriverConfig> {
  constructor(
    private readonly config: ConfigService,
    private readonly contexts: UseCaseCtxService,
    private readonly traceIds: TraceIdService,
    private readonly reporter: ErrorReporterService,
  ) {}

  createGqlOptions(): ApolloDriverConfig {
    const { nodeEnv } = this.config.config;
    return {
      typePaths: moduleTypePaths(),
      path: GRAPHQL_PATH,
      useGlobalPrefix: true,
      graphiql: nodeEnv === NodeEnvironment.Development,
      introspection: nodeEnv !== NodeEnvironment.Production,
      includeStacktraceInErrorResponses: false,
      subscriptions: {
        'graphql-ws': {
          path: GRAPHQL_PATH,
          onConnect: (connection: WebSocketConnectionInput) => this.acceptConnection(connection),
        },
      },
      context: (input: GraphqlContextInput) => this.createContext(input),
    };
  }

  private async createContext(input: GraphqlContextInput): Promise<GraphqlContext> {
    const request = 'req' in input ? this.fromHttp(input.req) : this.fromWebSocket(input);
    try {
      return { ctx: await this.contexts.create(request) };
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
    return {
      authorization: request.get(HttpHeader.Authorization) ?? null,
      acceptLanguage: request.get(HttpHeader.AcceptLanguage) ?? null,
      traceId: this.traceIds.current(),
    };
  }

  private fromWebSocket(context: WebSocketContextInput): TransportRequest {
    return {
      authorization: readConnectionParam(context.connectionParams, ConnectionParam.Authorization),
      acceptLanguage: context.extra.request.headers[HttpHeader.AcceptLanguage] ?? null,
      traceId: this.traceIds.current(),
    };
  }
}
