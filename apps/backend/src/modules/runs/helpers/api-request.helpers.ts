import {
  API_REQUEST_BACKOFF_BASE_MS,
  API_REQUEST_BACKOFF_FACTOR,
  API_REQUEST_REDIRECT_STATUS_MIN,
  API_REQUEST_OK_STATUS_MIN,
  RETRYABLE_API_REQUEST_OUTCOMES,
} from '@/modules/runs/constants/api-request.constants';
import type { StepData } from '@/modules/runs/typedefs/run-step.typedefs';
import { isRetryableUpstreamStatus } from '@/platform/errors/helpers/upstream.helpers';
import type { OutboundHttpResult } from '@/platform/outbound-http/typedefs/outbound-http.typedefs';

export const isApiRequestOk = ({ status }: OutboundHttpResult): boolean =>
  status !== null &&
  status >= API_REQUEST_OK_STATUS_MIN &&
  status < API_REQUEST_REDIRECT_STATUS_MIN;

export const isRetryableApiResult = (result: OutboundHttpResult): boolean =>
  RETRYABLE_API_REQUEST_OUTCOMES.has(result.outcome) ||
  (result.status !== null && isRetryableUpstreamStatus(result.status));

export const apiRequestBackoffMs = (retry: number): number =>
  API_REQUEST_BACKOFF_BASE_MS * API_REQUEST_BACKOFF_FACTOR ** (retry - 1);

const parseBody = (body: string | null): unknown => {
  if (body === null) {
    return null;
  }
  try {
    return JSON.parse(body);
  } catch {
    return body;
  }
};

export const apiRequestOutput = (result: OutboundHttpResult): StepData => ({
  ok: isApiRequestOk(result),
  status: result.status,
  body: parseBody(result.body),
});
