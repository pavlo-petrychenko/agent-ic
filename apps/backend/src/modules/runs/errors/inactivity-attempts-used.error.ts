import { ErrorReason } from '@agent-ic/contracts';
import { INACTIVITY_ATTEMPTS_USED_MESSAGE } from '@/modules/runs/constants/run-error.constants';
import { DomainErrorKind } from '@/platform/errors/constants/domain-error.constants';
import { DomainError } from '@/platform/errors/errors/domain.error';

export class InactivityAttemptsUsedError extends DomainError {
  readonly kind = DomainErrorKind.PreconditionFailed;
  readonly reason = ErrorReason.InactivityAttemptsUsed;

  constructor(conversationId: string) {
    super(INACTIVITY_ATTEMPTS_USED_MESSAGE, { details: { conversationId } });
  }
}
