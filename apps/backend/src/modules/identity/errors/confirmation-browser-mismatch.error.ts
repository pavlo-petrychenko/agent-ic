import { ErrorReason } from '@agent-ic/contracts';
import { CONFIRMATION_BROWSER_MISMATCH_MESSAGE } from '@/modules/identity/constants/identity-error.constants';
import { DomainErrorKind } from '@/platform/errors/constants/domain-error.constants';
import { DomainError } from '@/platform/errors/errors/domain.error';

export class ConfirmationBrowserMismatchError extends DomainError {
  readonly kind = DomainErrorKind.Forbidden;
  readonly reason = ErrorReason.ConfirmationBrowserMismatch;

  constructor() {
    super(CONFIRMATION_BROWSER_MISMATCH_MESSAGE);
  }
}
