import { ErrorReason } from '@agent-ic/contracts';
import { KNOWLEDGE_CONNECTION_IN_USE_MESSAGE } from '@/modules/knowledge/constants/knowledge-error.constants';
import { DomainErrorKind } from '@/platform/errors/constants/domain-error.constants';
import { DomainError } from '@/platform/errors/errors/domain.error';

export class KnowledgeConnectionInUseError extends DomainError {
  readonly kind = DomainErrorKind.Conflict;
  readonly reason = ErrorReason.KnowledgeConnectionInUse;

  constructor() {
    super(KNOWLEDGE_CONNECTION_IN_USE_MESSAGE);
  }
}
