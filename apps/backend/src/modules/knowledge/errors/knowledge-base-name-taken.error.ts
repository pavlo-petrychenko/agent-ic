import { ErrorReason } from '@agent-ic/contracts';
import { KNOWLEDGE_BASE_NAME_TAKEN_MESSAGE } from '@/modules/knowledge/constants/knowledge-error.constants';
import { DomainErrorKind } from '@/platform/errors/constants/domain-error.constants';
import { DomainError } from '@/platform/errors/errors/domain.error';

export class KnowledgeBaseNameTakenError extends DomainError {
  readonly kind = DomainErrorKind.Conflict;
  readonly reason = ErrorReason.KnowledgeBaseNameTaken;

  constructor() {
    super(KNOWLEDGE_BASE_NAME_TAKEN_MESSAGE);
  }
}
