import { Catch } from '@nestjs/common';
import type { ArgumentsHost, ExceptionFilter } from '@nestjs/common';
import { GqlArgumentsHost } from '@nestjs/graphql';
import type { Request, Response } from 'express';
import type { GraphQLError } from 'graphql';
import { TraceIdService } from '@/platform/context/trace-id.service';
import { ErrorReporter } from '@/platform/errors/error.reporter';
import { PROBLEM_CONTENT_TYPE, TransportType } from '@/platform/errors/errors.constants';
import { GraphqlErrorMapper } from '@/platform/errors/graphql-error.mapper';
import { ProblemDetailsMapper } from '@/platform/errors/problem-details.mapper';
import type { GraphqlContext } from '@/platform/graphql/graphql.typedefs';

@Catch()
export class TransportExceptionFilter implements ExceptionFilter {
  constructor(
    private readonly graphqlErrors: GraphqlErrorMapper,
    private readonly problems: ProblemDetailsMapper,
    private readonly reporter: ErrorReporter,
    private readonly traceIds: TraceIdService,
  ) {}

  catch(exception: unknown, host: ArgumentsHost): GraphQLError | undefined {
    switch (host.getType<TransportType>()) {
      case TransportType.Graphql:
        return this.toGraphqlError(exception, host);
      case TransportType.Http:
        this.sendProblem(exception, host);
        return undefined;
      default:
        throw exception;
    }
  }

  private toGraphqlError(exception: unknown, host: ArgumentsHost): GraphQLError {
    const context = GqlArgumentsHost.create(host).getContext<Partial<GraphqlContext>>();
    const traceId = context.ctx?.traceId ?? this.traceIds.current();
    this.reporter.report(exception, traceId);
    return this.graphqlErrors.toGraphqlError(exception, traceId);
  }

  private sendProblem(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const request = http.getRequest<Request>();
    const traceId = this.traceIds.current();
    this.reporter.report(exception, traceId);
    const problem = this.problems.toProblem(exception, traceId, request.originalUrl);
    http.getResponse<Response>().status(problem.status).type(PROBLEM_CONTENT_TYPE).json(problem);
  }
}
