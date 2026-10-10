import { ErrorReason } from '@agent-ic/contracts';
import { CONVERSATION_CLOSED_MESSAGE } from '@/modules/conversations/constants/conversation-error.constants';
import { DomainErrorKind } from '@/platform/errors/constants/domain-error.constants';
import { DomainError } from '@/platform/errors/errors/domain.error';

export class ConversationClosedError extends DomainError {
  readonly kind = DomainErrorKind.PreconditionFailed;
  readonly reason = ErrorReason.ConversationClosed;

  constructor(conversationId: string) {
    super(CONVERSATION_CLOSED_MESSAGE, { details: { conversationId } });
  }
}
