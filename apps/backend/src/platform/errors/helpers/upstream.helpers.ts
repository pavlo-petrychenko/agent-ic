import { SERVER_ERROR_STATUS_MIN } from '@/platform/errors/constants/http-status.constants';
import { RETRYABLE_UPSTREAM_STATUSES } from '@/platform/errors/constants/upstream.constants';

export const isRetryableUpstreamStatus = (status: number): boolean =>
  status >= SERVER_ERROR_STATUS_MIN || RETRYABLE_UPSTREAM_STATUSES.has(status);
