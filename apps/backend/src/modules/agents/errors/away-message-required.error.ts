import { ErrorReason } from '@agent-ic/contracts';
import { AWAY_MESSAGE_REQUIRED_MESSAGE } from '@/modules/agents/constants/agent-error.constants';
import { DomainErrorKind } from '@/platform/errors/constants/domain-error.constants';
import { DomainError } from '@/platform/errors/errors/domain.error';

export class AwayMessageRequiredError extends DomainError {
  readonly kind = DomainErrorKind.ValidationFailed;
  readonly reason = ErrorReason.AwayMessageRequired;

  constructor() {
    super(AWAY_MESSAGE_REQUIRED_MESSAGE);
  }
}
