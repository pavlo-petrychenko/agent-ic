import { ErrorReason } from '@agent-ic/contracts';
import { CANNOT_DELETE_YOURSELF } from '@/modules/identity/constants/workspace-error.constants';
import { DomainErrorKind } from '@/platform/errors/constants/domain-error.constants';
import { DomainError } from '@/platform/errors/errors/domain.error';

export class CannotDeleteYourselfError extends DomainError {
  readonly kind = DomainErrorKind.ValidationFailed;
  readonly reason = ErrorReason.CannotDeleteYourself;

  constructor() {
    super(CANNOT_DELETE_YOURSELF);
  }
}
