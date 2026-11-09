import { ErrorReason } from '@agent-ic/contracts';
import { TEMPLATE_KNOWLEDGE_BASE_NOT_FOUND_MESSAGE } from '@/modules/agents/constants/agent-error.constants';
import { DomainErrorKind } from '@/platform/errors/constants/domain-error.constants';
import { DomainError } from '@/platform/errors/errors/domain.error';

export class TemplateKnowledgeBaseNotFoundError extends DomainError {
  readonly kind = DomainErrorKind.NotFound;
  readonly reason = ErrorReason.KnowledgeBaseNotFound;

  constructor(knowledgeBaseIds: readonly string[]) {
    super(TEMPLATE_KNOWLEDGE_BASE_NOT_FOUND_MESSAGE, { clientDetails: { knowledgeBaseIds } });
  }
}
