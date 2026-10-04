import { ErrorReason } from '@agent-ic/contracts';
import { DomainErrorKind } from '@/platform/errors/constants/domain-error.constants';
import { DomainError } from '@/platform/errors/errors/domain.error';
import { INVALID_CURSOR_MESSAGE } from '@/platform/graphql/relay/relay.constants';

export class InvalidCursorError extends DomainError {
  readonly kind = DomainErrorKind.ValidationFailed;
  readonly reason = ErrorReason.InvalidCursor;

  constructor(cursor: string) {
    super(INVALID_CURSOR_MESSAGE, { details: { cursor } });
  }
}
