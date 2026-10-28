import { ErrorReason } from '@agent-ic/contracts';
import {
  DOCUMENT_PARSE_ERROR_MESSAGE,
  DocumentParseErrorCode,
} from '@/modules/knowledge/constants/document-parser.constants';
import { DomainErrorKind } from '@/platform/errors/constants/domain-error.constants';
import { DomainError } from '@/platform/errors/errors/domain.error';

export class DocumentParseError extends DomainError {
  readonly kind = DomainErrorKind.ValidationFailed;
  readonly reason = ErrorReason.KnowledgeDocumentInvalid;

  constructor(
    readonly code: DocumentParseErrorCode,
    options: { readonly cause?: unknown } = {},
  ) {
    super(DOCUMENT_PARSE_ERROR_MESSAGE[code], { details: { code }, cause: options.cause });
  }

  static unreadable(cause: unknown): DocumentParseError {
    return new DocumentParseError(DocumentParseErrorCode.Unreadable, { cause });
  }
}
