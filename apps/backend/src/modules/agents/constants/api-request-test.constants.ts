import { RequestBodyKind } from '@agent-ic/flow';
import { SECONDS_PER_MINUTE } from '@/platform/clock/constants/time.constants';
import { defineRateLimitPolicy } from '@/platform/rate-limit/helpers/rate-limit.helpers';

const API_REQUEST_TESTS_PER_MINUTE = 20;

export const CONTENT_TYPE_HEADER = 'content-type';

export const API_REQUEST_CONTENT_TYPE: Readonly<Record<RequestBodyKind, string | null>> = {
  [RequestBodyKind.None]: null,
  [RequestBodyKind.Json]: 'application/json',
  [RequestBodyKind.Text]: 'text/plain; charset=utf-8',
};

export const API_REQUEST_TEST_RATE_LIMIT = defineRateLimitPolicy({
  name: 'agents-api-request-test',
  capacity: API_REQUEST_TESTS_PER_MINUTE,
  refillPerSecond: API_REQUEST_TESTS_PER_MINUTE / SECONDS_PER_MINUTE,
});
