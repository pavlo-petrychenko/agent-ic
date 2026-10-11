import { ErrorReason } from '@agent-ic/contracts';
import { CANNOT_TRANSFER_TO_YOURSELF_MESSAGE } from '@/modules/identity/constants/workspace-error.constants';
import { DomainErrorKind } from '@/platform/errors/constants/domain-error.constants';
import { DomainError } from '@/platform/errors/errors/domain.error';

export class CannotTransferToYourselfError extends DomainError {
  readonly kind = DomainErrorKind.ValidationFailed;
  readonly reason = ErrorReason.CannotTransferToYourself;

  constructor() {
    super(CANNOT_TRANSFER_TO_YOURSELF_MESSAGE);
  }
}
