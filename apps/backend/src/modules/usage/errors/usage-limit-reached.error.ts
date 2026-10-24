import { ErrorReason } from '@agent-ic/contracts';
import { USAGE_LIMIT_REACHED_MESSAGE } from '@/modules/usage/constants/usage.constants';
import { LimitScope } from '@/platform/errors/constants/domain-error.constants';
import { LimitReachedError } from '@/platform/errors/errors/limit-reached.error';

export class UsageLimitReachedError extends LimitReachedError {
  readonly reason = ErrorReason.UsageLimitReached;
  readonly scope = LimitScope.Plan;

  constructor(periodEnd: Date) {
    const details = { periodEnd: periodEnd.toISOString() };
    super(USAGE_LIMIT_REACHED_MESSAGE, { details, clientDetails: details });
  }
}
