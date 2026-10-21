import { ErrorReason } from '@agent-ic/contracts';
import { DomainErrorKind } from '@/platform/errors/constants/domain-error.constants';
import { DomainError } from '@/platform/errors/errors/domain.error';
import { LLM_MODEL_UNKNOWN_MESSAGE } from '@/platform/llm/constants/llm-gateway.constants';

export class LlmModelUnknownError extends DomainError {
  readonly kind = DomainErrorKind.PreconditionFailed;
  readonly reason = ErrorReason.StepModelUnknown;

  constructor(model: string) {
    super(LLM_MODEL_UNKNOWN_MESSAGE, { details: { model } });
  }
}
