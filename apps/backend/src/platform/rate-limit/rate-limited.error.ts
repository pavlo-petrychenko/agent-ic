import { ErrorReason } from '@agent-ic/contracts';
import { LimitScope } from '@/platform/errors/errors.constants';
import { LimitReachedError } from '@/platform/errors/limit-reached.error';
import { RATE_LIMITED_MESSAGE } from '@/platform/rate-limit/rate-limit.constants';

export class RateLimitedError extends LimitReachedError {
  readonly reason = ErrorReason.RateLimited;
  readonly scope = LimitScope.Rate;

  constructor(readonly retryAfterSeconds: number) {
    super(RATE_LIMITED_MESSAGE, { details: { retryAfterSeconds } });
  }
}
