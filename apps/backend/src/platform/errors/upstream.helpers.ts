import {
  RETRYABLE_UPSTREAM_STATUSES,
  SERVER_ERROR_STATUS_MIN,
} from '@/platform/errors/errors.constants';

export const isRetryableUpstreamStatus = (status: number): boolean =>
  status >= SERVER_ERROR_STATUS_MIN || RETRYABLE_UPSTREAM_STATUSES.has(status);
