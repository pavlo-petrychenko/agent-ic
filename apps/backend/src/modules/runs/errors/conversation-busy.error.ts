import { ErrorReason } from '@agent-ic/contracts';
import { CONVERSATION_BUSY_MESSAGE } from '@/modules/runs/constants/run-error.constants';
import { DomainErrorKind } from '@/platform/errors/constants/domain-error.constants';
import { DomainError } from '@/platform/errors/errors/domain.error';

export class ConversationBusyError extends DomainError {
  readonly kind = DomainErrorKind.Conflict;
  readonly reason = ErrorReason.ConversationBusy;

  constructor(conversationId: string) {
    super(CONVERSATION_BUSY_MESSAGE, { details: { conversationId } });
  }
}
