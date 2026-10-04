import { ErrorReason } from '@agent-ic/contracts';

import { UPSTREAM_ERROR_MESSAGE } from './errors.constants';
import type { UpstreamErrorOptions } from './errors.typedefs';
import { isRetryableUpstreamStatus } from './upstream.helpers';

export class UpstreamError extends Error {
  readonly reason = ErrorReason.UpstreamFailed;
  readonly retryable: boolean;

  constructor(
    readonly upstream: string,
    options: UpstreamErrorOptions,
  ) {
    super(UPSTREAM_ERROR_MESSAGE, { cause: options.cause });
    this.name = new.target.name;
    this.retryable = options.retryable;
  }

  static fromStatus(upstream: string, status: number, cause?: unknown): UpstreamError {
    return new UpstreamError(upstream, { retryable: isRetryableUpstreamStatus(status), cause });
  }
}
