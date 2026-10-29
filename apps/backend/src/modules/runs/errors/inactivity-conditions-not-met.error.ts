import { ErrorReason } from '@agent-ic/contracts';
import type { InactivityFireOutcome } from '@/modules/runs/constants/inactivity.constants';
import { INACTIVITY_CONDITIONS_NOT_MET_MESSAGE } from '@/modules/runs/constants/run-error.constants';
import { DomainErrorKind } from '@/platform/errors/constants/domain-error.constants';
import { DomainError } from '@/platform/errors/errors/domain.error';

export class InactivityConditionsNotMetError extends DomainError {
  readonly kind = DomainErrorKind.PreconditionFailed;
  readonly reason = ErrorReason.InactivityConditionsNotMet;

  constructor(conversationId: string, outcome: InactivityFireOutcome) {
    const details = { conversationId, outcome };
    super(INACTIVITY_CONDITIONS_NOT_MET_MESSAGE, { details, clientDetails: { outcome } });
  }
}
