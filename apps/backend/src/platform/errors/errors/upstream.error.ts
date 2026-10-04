import { ErrorReason } from '@agent-ic/contracts';
import { UPSTREAM_ERROR_MESSAGE } from '@/platform/errors/constants/upstream.constants';
import { isRetryableUpstreamStatus } from '@/platform/errors/helpers/upstream.helpers';
import type { UpstreamErrorOptions } from '@/platform/errors/typedefs/upstream.typedefs';

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
