import { ErrorReason } from '@agent-ic/contracts';
import { KNOWLEDGE_BASE_HAS_SOURCES_MESSAGE } from '@/modules/knowledge/constants/knowledge-error.constants';
import { DomainErrorKind } from '@/platform/errors/constants/domain-error.constants';
import { DomainError } from '@/platform/errors/errors/domain.error';

export class KnowledgeBaseHasSourcesError extends DomainError {
  readonly kind = DomainErrorKind.Conflict;
  readonly reason = ErrorReason.KnowledgeBaseHasSources;

  constructor() {
    super(KNOWLEDGE_BASE_HAS_SOURCES_MESSAGE);
  }
}
