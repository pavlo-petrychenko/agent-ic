import { ErrorReason } from '@agent-ic/contracts';
import { DomainErrorKind } from '@/platform/errors/constants/domain-error.constants';
import { DomainError } from '@/platform/errors/errors/domain.error';
import { SECRET_TAMPERED_MESSAGE } from '@/platform/secrets/constants/secret-box.constants';

export class SecretTamperedError extends DomainError {
  readonly kind = DomainErrorKind.PreconditionFailed;
  readonly reason = ErrorReason.SecretTampered;

  constructor(cause?: unknown) {
    super(SECRET_TAMPERED_MESSAGE, { cause });
  }
}
