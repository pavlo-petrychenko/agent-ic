import { ErrorReason } from '@agent-ic/contracts';
import { DomainErrorKind } from '@/platform/errors/constants/domain-error.constants';
import { DomainError } from '@/platform/errors/errors/domain.error';
import { INVALID_ID_MESSAGE } from '@/platform/ids/constants/ids.constants';

export class InvalidIdError extends DomainError {
  readonly kind = DomainErrorKind.ValidationFailed;
  readonly reason = ErrorReason.InvalidId;

  constructor(expectedPrefix: string, value: string) {
    super(INVALID_ID_MESSAGE, { details: { expectedPrefix, value } });
  }
}
