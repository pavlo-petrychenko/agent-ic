import { ErrorReason } from '@agent-ic/contracts';
import { KNOWLEDGE_BASE_IN_USE_MESSAGE } from '@/modules/knowledge/constants/knowledge-error.constants';
import { DomainErrorKind } from '@/platform/errors/constants/domain-error.constants';
import { DomainError } from '@/platform/errors/errors/domain.error';

export class KnowledgeBaseInUseError extends DomainError {
  readonly kind = DomainErrorKind.Conflict;
  readonly reason = ErrorReason.KnowledgeBaseInUse;

  constructor(usageCount: number) {
    super(KNOWLEDGE_BASE_IN_USE_MESSAGE, { details: { usageCount } });
  }
}
