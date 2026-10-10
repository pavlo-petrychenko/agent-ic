import { ErrorReason } from '@agent-ic/contracts';
import { AGENT_IS_LIVE_MESSAGE } from '@/modules/agents/constants/agent-error.constants';
import { DomainErrorKind } from '@/platform/errors/constants/domain-error.constants';
import { DomainError } from '@/platform/errors/errors/domain.error';

export class AgentIsLiveError extends DomainError {
  readonly kind = DomainErrorKind.PreconditionFailed;
  readonly reason = ErrorReason.AgentIsLive;

  constructor() {
    super(AGENT_IS_LIVE_MESSAGE);
  }
}
