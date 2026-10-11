import { ErrorReason } from '@agent-ic/contracts';
import { INVALID_CONVERSATION_INPUT_MESSAGE } from '@/modules/conversations/constants/conversation-error.constants';
import { DomainErrorKind } from '@/platform/errors/constants/domain-error.constants';
import { DomainError } from '@/platform/errors/errors/domain.error';
import type { FieldIssue } from '@/platform/errors/typedefs/domain-error.typedefs';

export class InvalidConversationInputError extends DomainError {
  readonly kind = DomainErrorKind.ValidationFailed;
  readonly reason = ErrorReason.InvalidRequest;

  constructor(fields: readonly FieldIssue[]) {
    super(INVALID_CONVERSATION_INPUT_MESSAGE, { fields });
  }
}
