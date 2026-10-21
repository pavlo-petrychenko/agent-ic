import { ErrorReason } from '@agent-ic/contracts';
import { DomainErrorKind } from '@/platform/errors/constants/domain-error.constants';
import { DomainError } from '@/platform/errors/errors/domain.error';
import { LLM_OUTPUT_INVALID_MESSAGE } from '@/platform/llm/constants/llm-gateway.constants';

export class LlmOutputInvalidError extends DomainError {
  readonly kind = DomainErrorKind.PreconditionFailed;
  readonly reason = ErrorReason.LlmOutputInvalid;

  constructor(model: string, cause: unknown) {
    super(LLM_OUTPUT_INVALID_MESSAGE, { details: { model }, cause });
  }
}
