import { ErrorReason } from '@agent-ic/contracts';
import { AGENT_TEMPLATE_WITHOUT_KNOWLEDGE_MESSAGE } from '@/modules/agents/constants/agent-error.constants';
import { DomainErrorKind } from '@/platform/errors/constants/domain-error.constants';
import { DomainError } from '@/platform/errors/errors/domain.error';

export class AgentTemplateWithoutKnowledgeError extends DomainError {
  readonly kind = DomainErrorKind.ValidationFailed;
  readonly reason = ErrorReason.AgentTemplateWithoutKnowledge;

  constructor(templateKey: string) {
    super(AGENT_TEMPLATE_WITHOUT_KNOWLEDGE_MESSAGE, { clientDetails: { templateKey } });
  }
}
