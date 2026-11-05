import { ErrorReason } from '@agent-ic/contracts';
import { KNOWLEDGE_SOURCE_NOT_SYNCABLE_MESSAGE } from '@/modules/knowledge/constants/knowledge-error.constants';
import { DomainErrorKind } from '@/platform/errors/constants/domain-error.constants';
import { DomainError } from '@/platform/errors/errors/domain.error';

export class KnowledgeSourceNotSyncableError extends DomainError {
  readonly kind = DomainErrorKind.Conflict;
  readonly reason = ErrorReason.KnowledgeSourceNotSyncable;

  constructor() {
    super(KNOWLEDGE_SOURCE_NOT_SYNCABLE_MESSAGE);
  }
}
