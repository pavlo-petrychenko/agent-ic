import { ErrorReason } from '@agent-ic/contracts';
import { CONVERSATION_NOT_AUTO_CLOSABLE_MESSAGE } from '@/modules/conversations/constants/conversation-error.constants';
import { DomainErrorKind } from '@/platform/errors/constants/domain-error.constants';
import { DomainError } from '@/platform/errors/errors/domain.error';

export class ConversationNotAutoClosableError extends DomainError {
  readonly kind = DomainErrorKind.PreconditionFailed;
  readonly reason = ErrorReason.ConversationNotAutoClosable;

  constructor(conversationId: string) {
    super(CONVERSATION_NOT_AUTO_CLOSABLE_MESSAGE, { details: { conversationId } });
  }
}
