import { ErrorReason } from '@agent-ic/contracts';
import { DomainErrorKind, LimitScope } from '@/platform/errors/constants/domain-error.constants';
import { DomainError } from '@/platform/errors/errors/domain.error';
import { LimitReachedError } from '@/platform/errors/errors/limit-reached.error';
import {
  SAMPLE_CLIENT_DETAILS,
  SAMPLE_ERROR_MESSAGE,
  SAMPLE_FIELD_PATH,
  SAMPLE_INTERNAL_DETAIL,
} from '@test/support/constants/sample-errors.constants';

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

export class SampleUnavailableError extends DomainError {
  readonly kind = DomainErrorKind.Unavailable;
  readonly reason = ErrorReason.UpstreamFailed;

  constructor() {
    super(SAMPLE_ERROR_MESSAGE);
  }
}

export class SampleConflictError extends DomainError {
  readonly kind = DomainErrorKind.Conflict;
  readonly reason = ErrorReason.InvalidRequest;

  constructor() {
    super(SAMPLE_ERROR_MESSAGE, {
      details: { internal: SAMPLE_INTERNAL_DETAIL },
      clientDetails: SAMPLE_CLIENT_DETAILS,
    });
  }
}
