import { ErrorReason } from '@agent-ic/contracts';
import { UNSUPPORTED_CONTENT_TYPE_MESSAGE } from '@/modules/identity/constants/identity-error.constants';
import { DomainErrorKind } from '@/platform/errors/constants/domain-error.constants';
import { DomainError } from '@/platform/errors/errors/domain.error';

export class UnsupportedContentTypeError extends DomainError {
  readonly kind = DomainErrorKind.UnsupportedMediaType;
  readonly reason = ErrorReason.UnsupportedContentType;

  constructor() {
    super(UNSUPPORTED_CONTENT_TYPE_MESSAGE);
  }
}
