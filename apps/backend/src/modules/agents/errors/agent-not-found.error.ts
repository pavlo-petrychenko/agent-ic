import { ErrorReason } from '@agent-ic/contracts';
import { AGENT_NOT_FOUND_MESSAGE } from '@/modules/agents/constants/agent-error.constants';
import { DomainErrorKind } from '@/platform/errors/constants/domain-error.constants';
import { DomainError } from '@/platform/errors/errors/domain.error';

export class AgentNotFoundError extends DomainError {
  readonly kind = DomainErrorKind.NotFound;
  readonly reason = ErrorReason.AgentNotFound;

  constructor() {
    super(AGENT_NOT_FOUND_MESSAGE);
  }
}
