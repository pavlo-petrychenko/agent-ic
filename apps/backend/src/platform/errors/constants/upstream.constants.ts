import { HttpStatus } from '@nestjs/common';

export const RETRYABLE_UPSTREAM_STATUSES: ReadonlySet<number> = new Set([
  HttpStatus.REQUEST_TIMEOUT,
  HttpStatus.TOO_MANY_REQUESTS,
]);

export const UPSTREAM_ERROR_MESSAGE = 'An upstream service failed.';
