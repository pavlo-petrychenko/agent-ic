import { ErrorReason } from '@agent-ic/contracts';
import { KNOWLEDGE_CONNECTION_NOT_FOUND_MESSAGE } from '@/modules/knowledge/constants/knowledge-error.constants';
import { DomainErrorKind } from '@/platform/errors/constants/domain-error.constants';
import { DomainError } from '@/platform/errors/errors/domain.error';

export class KnowledgeConnectionNotFoundError extends DomainError {
  readonly kind = DomainErrorKind.NotFound;
  readonly reason = ErrorReason.KnowledgeConnectionNotFound;

  constructor() {
    super(KNOWLEDGE_CONNECTION_NOT_FOUND_MESSAGE);
  }
}
