import { ErrorReason } from '@agent-ic/contracts';
import { KNOWLEDGE_UPLOAD_INVALID_MESSAGE } from '@/modules/knowledge/constants/knowledge-upload.constants';
import { DomainErrorKind } from '@/platform/errors/constants/domain-error.constants';
import { DomainError } from '@/platform/errors/errors/domain.error';

export class KnowledgeUploadInvalidError extends DomainError {
  readonly kind = DomainErrorKind.ValidationFailed;
  readonly reason = ErrorReason.KnowledgeUploadInvalid;

  constructor() {
    super(KNOWLEDGE_UPLOAD_INVALID_MESSAGE);
  }
}
