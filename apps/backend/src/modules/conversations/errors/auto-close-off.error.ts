import { ErrorReason } from '@agent-ic/contracts';
import { AUTO_CLOSE_OFF_MESSAGE } from '@/modules/conversations/constants/conversation-error.constants';
import { DomainErrorKind } from '@/platform/errors/constants/domain-error.constants';
import { DomainError } from '@/platform/errors/errors/domain.error';

export class AutoCloseOffError extends DomainError {
  readonly kind = DomainErrorKind.PreconditionFailed;
  readonly reason = ErrorReason.AutoCloseOff;

  constructor(conversationId: string) {
    super(AUTO_CLOSE_OFF_MESSAGE, { details: { conversationId } });
  }
}
