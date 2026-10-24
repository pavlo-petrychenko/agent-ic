import { ErrorReason } from '@agent-ic/contracts';
import { LLM_KEY_NOT_FOUND_MESSAGE } from '@/modules/llm-keys/constants/llm-key-error.constants';
import { DomainErrorKind } from '@/platform/errors/constants/domain-error.constants';
import { DomainError } from '@/platform/errors/errors/domain.error';

export class LlmKeyNotFoundError extends DomainError {
  readonly kind = DomainErrorKind.PreconditionFailed;
  readonly reason = ErrorReason.LlmKeyNotFound;

  constructor() {
    super(LLM_KEY_NOT_FOUND_MESSAGE);
  }
}
