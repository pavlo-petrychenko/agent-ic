import { ErrorReason } from '@agent-ic/contracts';
import type { KnowledgeDocumentStaleReason } from '@/modules/knowledge/constants/knowledge.constants';
import { DomainErrorKind } from '@/platform/errors/constants/domain-error.constants';
import { DomainError } from '@/platform/errors/errors/domain.error';

export class GoogleDriveFileRemovedError extends DomainError {
  readonly kind = DomainErrorKind.NotFound;
  readonly reason = ErrorReason.KnowledgeDocumentInvalid;

  constructor(readonly staleReason: KnowledgeDocumentStaleReason) {
    super('the selected Google document no longer exists');
  }
}

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

export class GoogleDocsSelectionInvalidError extends DomainError {
  readonly kind = DomainErrorKind.ValidationFailed;
  readonly reason = ErrorReason.KnowledgeDocumentInvalid;

  constructor() {
    super('none of the selected Google documents can be read');
  }
}
