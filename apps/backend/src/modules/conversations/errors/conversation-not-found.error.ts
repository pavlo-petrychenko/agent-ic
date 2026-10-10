import { ErrorReason } from '@agent-ic/contracts';
import { CONVERSATION_NOT_FOUND_MESSAGE } from '@/modules/conversations/constants/conversation-error.constants';
import { DomainErrorKind } from '@/platform/errors/constants/domain-error.constants';
import { DomainError } from '@/platform/errors/errors/domain.error';

export class ConversationNotFoundError extends DomainError {
  readonly kind = DomainErrorKind.NotFound;
  readonly reason = ErrorReason.ConversationNotFound;

  constructor(conversationId: string) {
    super(CONVERSATION_NOT_FOUND_MESSAGE, { details: { conversationId } });
  }
}
