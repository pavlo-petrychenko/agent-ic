import { ErrorReason } from '@agent-ic/contracts';
import { SAME_PASSWORD_MESSAGE } from '@/modules/identity/constants/identity-error.constants';
import { DomainErrorKind } from '@/platform/errors/constants/domain-error.constants';
import { DomainError } from '@/platform/errors/errors/domain.error';

export class SamePasswordError extends DomainError {
  readonly kind = DomainErrorKind.ValidationFailed;
  readonly reason = ErrorReason.SamePassword;

  constructor() {
    super(SAME_PASSWORD_MESSAGE);
  }
}
