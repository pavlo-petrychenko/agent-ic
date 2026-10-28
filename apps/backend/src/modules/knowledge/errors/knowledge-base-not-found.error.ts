import { ErrorReason } from '@agent-ic/contracts';
import { KNOWLEDGE_BASE_NOT_FOUND_MESSAGE } from '@/modules/knowledge/constants/knowledge-error.constants';
import { DomainErrorKind } from '@/platform/errors/constants/domain-error.constants';
import { DomainError } from '@/platform/errors/errors/domain.error';

export class KnowledgeBaseNotFoundError extends DomainError {
  readonly kind = DomainErrorKind.NotFound;
  readonly reason = ErrorReason.KnowledgeBaseNotFound;

  constructor() {
    super(KNOWLEDGE_BASE_NOT_FOUND_MESSAGE);
  }
}
