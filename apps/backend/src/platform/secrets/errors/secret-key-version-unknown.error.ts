import { ErrorReason } from '@agent-ic/contracts';
import { DomainErrorKind } from '@/platform/errors/constants/domain-error.constants';
import { DomainError } from '@/platform/errors/errors/domain.error';
import { SECRET_KEY_VERSION_UNKNOWN_MESSAGE } from '@/platform/secrets/constants/secret-box.constants';

export class SecretKeyVersionUnknownError extends DomainError {
  readonly kind = DomainErrorKind.PreconditionFailed;
  readonly reason = ErrorReason.SecretKeyVersionUnknown;

  constructor(version: number) {
    super(SECRET_KEY_VERSION_UNKNOWN_MESSAGE, { details: { version } });
  }
}
