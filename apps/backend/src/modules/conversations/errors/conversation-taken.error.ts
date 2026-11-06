import { ErrorReason } from '@agent-ic/contracts';
import { CONVERSATION_TAKEN_MESSAGE } from '@/modules/conversations/constants/conversation-error.constants';
import { DomainErrorKind } from '@/platform/errors/constants/domain-error.constants';
import { DomainError } from '@/platform/errors/errors/domain.error';

export class ConversationTakenError extends DomainError {
  readonly kind = DomainErrorKind.Conflict;
  readonly reason = ErrorReason.ConversationTaken;

  constructor(conversationId: string) {
    super(CONVERSATION_TAKEN_MESSAGE, { details: { conversationId } });
  }
}
