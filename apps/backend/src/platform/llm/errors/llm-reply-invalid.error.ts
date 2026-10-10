import { ErrorReason } from '@agent-ic/contracts';
import { DomainErrorKind } from '@/platform/errors/constants/domain-error.constants';
import { DomainError } from '@/platform/errors/errors/domain.error';
import { LLM_REPLY_INVALID_MESSAGE } from '@/platform/llm/constants/llm-gateway.constants';
import type { LlmModelId } from '@/platform/llm/constants/llm-model.constants';

export class LlmReplyInvalidError extends DomainError {
  readonly kind = DomainErrorKind.PreconditionFailed;
  readonly reason = ErrorReason.LlmReplyInvalid;

  constructor(model: LlmModelId, cause: unknown) {
    super(LLM_REPLY_INVALID_MESSAGE, { details: { model }, cause });
  }
}
