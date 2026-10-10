import { ErrorReason } from '@agent-ic/contracts';
import { MESSAGE_NOT_FOUND_MESSAGE } from '@/modules/conversations/constants/conversation-error.constants';
import { DomainErrorKind } from '@/platform/errors/constants/domain-error.constants';
import { DomainError } from '@/platform/errors/errors/domain.error';

export class MessageNotFoundError extends DomainError {
  readonly kind = DomainErrorKind.NotFound;
  readonly reason = ErrorReason.MessageNotFound;

  constructor(messageId: string) {
    super(MESSAGE_NOT_FOUND_MESSAGE, { details: { messageId } });
  }
}
