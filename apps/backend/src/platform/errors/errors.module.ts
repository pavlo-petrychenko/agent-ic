import { Global, Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';

import { ErrorReporter } from './error.reporter';
import { GraphqlErrorMapper } from './graphql-error.mapper';
import { JobErrorMapper } from './job-error.mapper';
import { ProblemDetailsMapper } from './problem-details.mapper';
import { TransportExceptionFilter } from './transport-exception.filter';

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
