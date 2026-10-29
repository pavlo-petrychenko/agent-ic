import { ErrorReason } from '@agent-ic/contracts';
import { NO_INACTIVITY_TRIGGER_MESSAGE } from '@/modules/runs/constants/run-error.constants';
import { DomainErrorKind } from '@/platform/errors/constants/domain-error.constants';
import { DomainError } from '@/platform/errors/errors/domain.error';

export class NoInactivityTriggerError extends DomainError {
  readonly kind = DomainErrorKind.PreconditionFailed;
  readonly reason = ErrorReason.NoInactivityTrigger;

  constructor(conversationId: string) {
    super(NO_INACTIVITY_TRIGGER_MESSAGE, { details: { conversationId } });
  }
}
