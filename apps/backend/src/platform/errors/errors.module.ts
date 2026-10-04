import { Global, Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { ErrorReporter } from '@/platform/errors/error.reporter';
import { GraphqlErrorMapper } from '@/platform/errors/graphql-error.mapper';
import { JobErrorMapper } from '@/platform/errors/job-error.mapper';
import { ProblemDetailsMapper } from '@/platform/errors/problem-details.mapper';
import { TransportExceptionFilter } from '@/platform/errors/transport-exception.filter';

@Global()
@Module({
  providers: [
    ErrorReporter,
    GraphqlErrorMapper,
    ProblemDetailsMapper,
    JobErrorMapper,
    { provide: APP_FILTER, useClass: TransportExceptionFilter },
  ],
  exports: [ErrorReporter, GraphqlErrorMapper, ProblemDetailsMapper, JobErrorMapper],
})
export class ErrorsModule {}
