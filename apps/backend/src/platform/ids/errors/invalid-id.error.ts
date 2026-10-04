import { ErrorReason } from '@agent-ic/contracts';
import { DomainError } from '@/platform/errors/domain.error';
import { DomainErrorKind } from '@/platform/errors/errors.constants';
import { INVALID_ID_MESSAGE } from '@/platform/ids/constants/ids.constants';

export class InvalidIdError extends DomainError {
  readonly kind = DomainErrorKind.ValidationFailed;
  readonly reason = ErrorReason.InvalidId;

  constructor(expectedPrefix: string, value: string) {
    super(INVALID_ID_MESSAGE, { details: { expectedPrefix, value } });
  }
}
