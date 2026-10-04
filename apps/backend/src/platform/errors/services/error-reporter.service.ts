import { HttpException, Injectable, Logger } from '@nestjs/common';
import { ErrorLogMessage } from '@/platform/errors/constants/error-reporter.constants';
import { SERVER_ERROR_STATUS_MIN } from '@/platform/errors/constants/http-status.constants';
import { DomainError } from '@/platform/errors/errors/domain.error';
import { UpstreamError } from '@/platform/errors/errors/upstream.error';

@Injectable()
export class ErrorReporterService {
  private readonly logger = new Logger(ErrorReporterService.name);

  report(error: unknown, traceId: string): void {
    if (error instanceof DomainError) {
      this.logger.log({ msg: ErrorLogMessage.DomainError, reason: error.reason, traceId });
      return;
    }
    if (error instanceof UpstreamError) {
      this.logger.warn({ msg: ErrorLogMessage.UpstreamError, err: error, traceId });
      return;
    }
    if (error instanceof HttpException && error.getStatus() < SERVER_ERROR_STATUS_MIN) {
      this.logger.log({ msg: ErrorLogMessage.RequestRejected, status: error.getStatus(), traceId });
      return;
    }
    this.logger.error({ msg: ErrorLogMessage.UnexpectedError, err: error, traceId });
  }
}
