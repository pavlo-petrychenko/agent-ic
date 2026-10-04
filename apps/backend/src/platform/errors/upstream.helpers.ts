import { RETRYABLE_UPSTREAM_STATUSES, SERVER_ERROR_STATUS_MIN } from './errors.constants';

export const isRetryableUpstreamStatus = (status: number): boolean =>
  status >= SERVER_ERROR_STATUS_MIN || RETRYABLE_UPSTREAM_STATUSES.has(status);
