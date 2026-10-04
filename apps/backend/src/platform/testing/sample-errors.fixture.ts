import { ErrorReason } from '@agent-ic/contracts';
import { DomainError } from '@/platform/errors/domain.error';
import { DomainErrorKind, LimitScope } from '@/platform/errors/errors.constants';
import { LimitReachedError } from '@/platform/errors/limit-reached.error';
import {
  SAMPLE_ERROR_MESSAGE,
  SAMPLE_FIELD_PATH,
} from '@/platform/testing/sample-errors.constants';

export class SampleValidationError extends DomainError {
  readonly kind = DomainErrorKind.ValidationFailed;
  readonly reason = ErrorReason.InvalidId;

  constructor() {
    super(SAMPLE_ERROR_MESSAGE, {
      fields: [{ path: SAMPLE_FIELD_PATH, reason: ErrorReason.InvalidId }],
    });
  }
}

export class SampleNotFoundError extends DomainError {
  readonly kind = DomainErrorKind.NotFound;
  readonly reason = ErrorReason.InvalidId;

  constructor() {
    super(SAMPLE_ERROR_MESSAGE);
  }
}

export class SampleRateLimitError extends LimitReachedError {
  readonly scope = LimitScope.Rate;
  readonly reason = ErrorReason.InvalidRequest;

  constructor() {
    super(SAMPLE_ERROR_MESSAGE);
  }
}

export class SamplePlanLimitError extends LimitReachedError {
  readonly scope = LimitScope.Plan;
  readonly reason = ErrorReason.InvalidRequest;

  constructor() {
    super(SAMPLE_ERROR_MESSAGE);
  }
}
