import { ErrorReason } from '@agent-ic/contracts';
import { DomainErrorKind } from '@/platform/errors/constants/domain-error.constants';
import { DomainError } from '@/platform/errors/errors/domain.error';
import { LLM_TOOL_ROUNDS_EXCEEDED_MESSAGE } from '@/platform/llm/constants/llm-gateway.constants';
import type { LlmModelId } from '@/platform/llm/constants/llm-model.constants';

export class LlmToolRoundsExceededError extends DomainError {
  readonly kind = DomainErrorKind.PreconditionFailed;
  readonly reason = ErrorReason.LlmToolRoundsExceeded;

  constructor(model: LlmModelId, maxToolRounds: number) {
    super(LLM_TOOL_ROUNDS_EXCEEDED_MESSAGE, { details: { model, maxToolRounds } });
  }
}
