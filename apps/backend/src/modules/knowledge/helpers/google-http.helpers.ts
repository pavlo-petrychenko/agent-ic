import { HttpStatus } from '@nestjs/common';
import type { z } from 'zod';
import { GoogleOAuthFailedError } from '@/modules/knowledge/errors/google-oauth-failed.error';
import { UpstreamError } from '@/platform/errors/errors/upstream.error';
import { isRetryableUpstreamStatus } from '@/platform/errors/helpers/upstream.helpers';
import { OutboundHttpOutcome } from '@/platform/outbound-http/constants/outbound-http.constants';
import { OutboundHttpGateway } from '@/platform/outbound-http/gateways/outbound-http.gateway';
import type {
  OutboundHttpRequest,
  OutboundHttpResult,
} from '@/platform/outbound-http/typedefs/outbound-http.typedefs';

export interface GoogleHttpRequestOptions {
  readonly onStatus?: (status: number, body: string | null) => Error | null;
  readonly onTruncated?: () => Error;
}

export const googleHttpRequest = async (
  http: OutboundHttpGateway,
  request: OutboundHttpRequest,
  options: GoogleHttpRequestOptions = {},
): Promise<OutboundHttpResult> => {
  const result = await http.send(request);
  if (result.outcome !== OutboundHttpOutcome.Responded) {
    throw new UpstreamError('google', {
      retryable: true,
      cause: new Error(result.outcome),
    });
  }
  const status = result.status;
  if (status === null) {
    throw new GoogleOAuthFailedError({ code: 'response_missing_status' });
  }
  if (status < HttpStatus.OK || status >= HttpStatus.AMBIGUOUS) {
    const statusError = options.onStatus?.(status, result.body);
    throw (
      statusError ??
      (isRetryableUpstreamStatus(status)
        ? UpstreamError.fromStatus('google', status)
        : new GoogleOAuthFailedError({ status }))
    );
  }
  if (result.body === null) {
    throw new GoogleOAuthFailedError({ code: 'response_missing' });
  }
  if (result.bodyTruncated) {
    throw options.onTruncated?.() ?? new GoogleOAuthFailedError({ code: 'response_truncated' });
  }
  return result;
};

export const googleJson = <T>(result: OutboundHttpResult, schema: z.ZodType<T>): T => {
  if (result.body === null) {
    throw new GoogleOAuthFailedError({ code: 'response_missing' });
  }
  let value: unknown;
  try {
    value = JSON.parse(result.body);
  } catch (cause) {
    throw new GoogleOAuthFailedError({ code: 'response_not_json' }, cause);
  }
  const parsed = schema.safeParse(value);
  if (!parsed.success) {
    throw new GoogleOAuthFailedError({ code: 'response_invalid' }, parsed.error);
  }
  return parsed.data;
};
