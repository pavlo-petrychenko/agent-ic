import { ErrorReason } from '@agent-ic/contracts';
import { AGENT_VERSION_IMMUTABLE_MESSAGE } from '@/modules/agents/constants/agent-error.constants';
import { DomainErrorKind } from '@/platform/errors/constants/domain-error.constants';
import { DomainError } from '@/platform/errors/errors/domain.error';

export class AgentVersionImmutableError extends DomainError {
  readonly kind = DomainErrorKind.PreconditionFailed;
  readonly reason = ErrorReason.AgentVersionImmutable;

  constructor() {
    super(AGENT_VERSION_IMMUTABLE_MESSAGE);
  }
}
