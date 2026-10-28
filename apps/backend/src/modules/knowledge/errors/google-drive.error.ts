import { ErrorReason } from '@agent-ic/contracts';
import { DomainErrorKind } from '@/platform/errors/constants/domain-error.constants';
import { DomainError } from '@/platform/errors/errors/domain.error';

export class GoogleDriveFileUnavailableError extends DomainError {
  readonly kind = DomainErrorKind.NotFound;
  readonly reason = ErrorReason.KnowledgeDocumentInvalid;

  constructor() {
    super('the selected Google document is unavailable');
  }
}

export class GoogleDriveExportTooLargeError extends DomainError {
  readonly kind = DomainErrorKind.ValidationFailed;
  readonly reason = ErrorReason.KnowledgeDocumentInvalid;

  constructor() {
    super('the selected Google document is too large');
  }
}
