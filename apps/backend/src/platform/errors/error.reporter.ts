import { HttpException, Injectable, Logger } from '@nestjs/common';
import { DomainError } from '@/platform/errors/domain.error';
import { ErrorLogMessage, SERVER_ERROR_STATUS_MIN } from '@/platform/errors/errors.constants';
import { UpstreamError } from '@/platform/errors/upstream.error';

@Injectable()
export class ErrorReporter {
  private readonly logger = new Logger(ErrorReporter.name);

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
