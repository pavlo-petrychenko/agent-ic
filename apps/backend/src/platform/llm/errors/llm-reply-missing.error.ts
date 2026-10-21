import { ErrorReason } from '@agent-ic/contracts';
import { DomainErrorKind } from '@/platform/errors/constants/domain-error.constants';
import { DomainError } from '@/platform/errors/errors/domain.error';
import { LLM_REPLY_MISSING_MESSAGE } from '@/platform/llm/constants/llm-gateway.constants';

export class LlmReplyMissingError extends DomainError {
  readonly kind = DomainErrorKind.PreconditionFailed;
  readonly reason = ErrorReason.LlmReplyMissing;

  constructor(model: string) {
    super(LLM_REPLY_MISSING_MESSAGE, { details: { model } });
  }
}
