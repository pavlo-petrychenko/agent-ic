import { ErrorReason } from '@agent-ic/contracts';
import { DomainError } from '@/platform/errors/domain.error';
import { DomainErrorKind } from '@/platform/errors/errors.constants';
import { INVALID_CURSOR_MESSAGE } from '@/platform/graphql/relay/relay.constants';

export class InvalidCursorError extends DomainError {
  readonly kind = DomainErrorKind.ValidationFailed;
  readonly reason = ErrorReason.InvalidCursor;

  constructor(cursor: string) {
    super(INVALID_CURSOR_MESSAGE, { details: { cursor } });
  }
}
