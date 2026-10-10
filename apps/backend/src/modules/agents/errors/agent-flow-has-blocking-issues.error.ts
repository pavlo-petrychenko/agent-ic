import { ErrorReason } from '@agent-ic/contracts';
import { AGENT_FLOW_HAS_BLOCKING_ISSUES_MESSAGE } from '@/modules/agents/constants/agent-error.constants';
import { DomainErrorKind } from '@/platform/errors/constants/domain-error.constants';
import { DomainError } from '@/platform/errors/errors/domain.error';

export class AgentFlowHasBlockingIssuesError extends DomainError {
  readonly kind = DomainErrorKind.PreconditionFailed;
  readonly reason = ErrorReason.AgentFlowHasBlockingIssues;

  constructor() {
    super(AGENT_FLOW_HAS_BLOCKING_ISSUES_MESSAGE);
  }
}
