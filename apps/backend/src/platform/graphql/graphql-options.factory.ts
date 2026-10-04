import type { ApolloDriverConfig } from '@nestjs/apollo';
import { Injectable } from '@nestjs/common';
import type { GqlOptionsFactory } from '@nestjs/graphql';
import type { Request } from 'express';

import { NodeEnvironment } from '@/platform/config/config.constants';
import { ConfigService } from '@/platform/config/config.service';
import type { TransportRequest } from '@/platform/context/context.typedefs';
import { TraceIdService } from '@/platform/context/trace-id.service';
import { UseCaseCtxFactory } from '@/platform/context/use-case-ctx.factory';
import { DomainError } from '@/platform/errors/domain.error';
import { ErrorReporter } from '@/platform/errors/error.reporter';
import { GraphqlErrorMapper } from '@/platform/errors/graphql-error.mapper';
import { HttpHeader } from '@/platform/http/http.constants';

import { ConnectionParam, GRAPHQL_PATH } from './graphql.constants';
import { moduleTypePaths, readConnectionParam } from './graphql.helpers';
import type {
  GraphqlContext,
  GraphqlContextInput,
  WebSocketConnectionInput,
  WebSocketContextInput,
} from './graphql.typedefs';

@Injectable()
export class GraphqlOptionsFactory implements GqlOptionsFactory<ApolloDriverConfig> {
  constructor(
    private readonly config: ConfigService,
    private readonly contexts: UseCaseCtxFactory,
    private readonly traceIds: TraceIdService,
    private readonly errors: GraphqlErrorMapper,
    private readonly reporter: ErrorReporter,
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
      throw this.errors.toGraphqlError(error, request.traceId);
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
