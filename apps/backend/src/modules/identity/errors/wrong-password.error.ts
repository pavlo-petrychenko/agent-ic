import { ErrorReason } from '@agent-ic/contracts';
import { WRONG_PASSWORD_MESSAGE } from '@/modules/identity/constants/identity-error.constants';
import { DomainErrorKind } from '@/platform/errors/constants/domain-error.constants';
import { DomainError } from '@/platform/errors/errors/domain.error';

export class WrongPasswordError extends DomainError {
  readonly kind = DomainErrorKind.Unauthenticated;
  readonly reason = ErrorReason.WrongPassword;

  constructor() {
    super(WRONG_PASSWORD_MESSAGE);
  }
}
