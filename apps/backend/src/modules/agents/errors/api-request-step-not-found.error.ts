import { ErrorReason } from '@agent-ic/contracts';
import { API_REQUEST_STEP_NOT_FOUND_MESSAGE } from '@/modules/agents/constants/agent-error.constants';
import { DomainErrorKind } from '@/platform/errors/constants/domain-error.constants';
import { DomainError } from '@/platform/errors/errors/domain.error';

export class ApiRequestStepNotFoundError extends DomainError {
  readonly kind = DomainErrorKind.NotFound;
  readonly reason = ErrorReason.ApiRequestStepNotFound;

  constructor() {
    super(API_REQUEST_STEP_NOT_FOUND_MESSAGE);
  }
}
