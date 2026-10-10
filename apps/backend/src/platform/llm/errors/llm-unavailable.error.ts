import { ErrorReason } from '@agent-ic/contracts';
import { DomainErrorKind } from '@/platform/errors/constants/domain-error.constants';
import { DomainError } from '@/platform/errors/errors/domain.error';
import { LLM_UNAVAILABLE_MESSAGE } from '@/platform/llm/constants/llm-gateway.constants';
import type { LlmModelId } from '@/platform/llm/constants/llm-model.constants';

export class LlmUnavailableError extends DomainError {
  readonly kind = DomainErrorKind.Unavailable;
  readonly reason = ErrorReason.LlmUnavailable;

  constructor(models: readonly LlmModelId[], causes: readonly unknown[]) {
    super(LLM_UNAVAILABLE_MESSAGE, {
      details: { models },
      cause: new AggregateError(causes, LLM_UNAVAILABLE_MESSAGE),
    });
  }
}
