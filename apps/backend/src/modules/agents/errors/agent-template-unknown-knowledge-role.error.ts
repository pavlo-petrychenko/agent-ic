import { ErrorReason } from '@agent-ic/contracts';
import { AGENT_TEMPLATE_UNKNOWN_KNOWLEDGE_ROLE_MESSAGE } from '@/modules/agents/constants/agent-error.constants';
import { DomainErrorKind } from '@/platform/errors/constants/domain-error.constants';
import { DomainError } from '@/platform/errors/errors/domain.error';

export class AgentTemplateUnknownKnowledgeRoleError extends DomainError {
  readonly kind = DomainErrorKind.ValidationFailed;
  readonly reason = ErrorReason.AgentTemplateUnknownKnowledgeRole;

  constructor(templateKey: string, roles: readonly string[]) {
    super(AGENT_TEMPLATE_UNKNOWN_KNOWLEDGE_ROLE_MESSAGE, { clientDetails: { templateKey, roles } });
  }
}
