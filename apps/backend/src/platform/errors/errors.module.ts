import { Global, Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { TransportExceptionFilter } from '@/platform/errors/filters/transport-exception.filter';
import { ErrorReporterService } from '@/platform/errors/services/error-reporter.service';

@Global()
@Module({
  providers: [ErrorReporterService, { provide: APP_FILTER, useClass: TransportExceptionFilter }],
  exports: [ErrorReporterService],
})
export class ErrorsModule {}
