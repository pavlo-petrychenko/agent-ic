import { Catch } from '@nestjs/common';
import type { ArgumentsHost, ExceptionFilter } from '@nestjs/common';
import { GqlArgumentsHost } from '@nestjs/graphql';
import type { Request, Response } from 'express';
import type { GraphQLError } from 'graphql';
import { TraceIdService } from '@/platform/context/services/trace-id.service';
import { PROBLEM_CONTENT_TYPE } from '@/platform/errors/constants/problem-details.constants';
import { toGraphqlError } from '@/platform/errors/helpers/graphql-error.helpers';
import { toProblemDetails } from '@/platform/errors/helpers/problem-details.helpers';
import { ErrorReporterService } from '@/platform/errors/services/error-reporter.service';
import type { GraphqlContext } from '@/platform/graphql/graphql.typedefs';
import { TransportType } from '@/platform/http/constants/transport.constants';

@Catch()
export class TransportExceptionFilter implements ExceptionFilter {
  constructor(
    private readonly reporter: ErrorReporterService,
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
    return toGraphqlError(exception, traceId);
  }

  private sendProblem(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const request = http.getRequest<Request>();
    const traceId = this.traceIds.current();
    this.reporter.report(exception, traceId);
    const problem = toProblemDetails(exception, traceId, request.originalUrl);
    http.getResponse<Response>().status(problem.status).type(PROBLEM_CONTENT_TYPE).json(problem);
  }
}
