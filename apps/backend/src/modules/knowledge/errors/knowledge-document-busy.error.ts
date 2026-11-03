import { ErrorReason } from '@agent-ic/contracts';
import { KNOWLEDGE_DOCUMENT_BUSY_MESSAGE } from '@/modules/knowledge/constants/knowledge-error.constants';
import { DomainErrorKind } from '@/platform/errors/constants/domain-error.constants';
import { DomainError } from '@/platform/errors/errors/domain.error';

export class KnowledgeDocumentBusyError extends DomainError {
  readonly kind = DomainErrorKind.Conflict;
  readonly reason = ErrorReason.KnowledgeDocumentBusy;

  constructor() {
    super(KNOWLEDGE_DOCUMENT_BUSY_MESSAGE);
  }
}
