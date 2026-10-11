import { HttpStatus } from '@nestjs/common';
import { OutboundHttpOutcome } from '@/platform/outbound-http/constants/outbound-http.constants';

export const API_REQUEST_BACKOFF_BASE_MS = 1_000;
export const API_REQUEST_BACKOFF_FACTOR = 2;
export const API_REQUEST_OK_STATUS_MIN = HttpStatus.OK;
export const API_REQUEST_REDIRECT_STATUS_MIN = HttpStatus.AMBIGUOUS;

export const RETRYABLE_API_REQUEST_OUTCOMES: ReadonlySet<OutboundHttpOutcome> = new Set([
  OutboundHttpOutcome.TimedOut,
  OutboundHttpOutcome.Unreachable,
]);
