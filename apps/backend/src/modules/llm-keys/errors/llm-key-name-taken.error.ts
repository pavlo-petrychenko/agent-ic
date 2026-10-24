import { ErrorReason } from '@agent-ic/contracts';
import { LLM_KEY_NAME_TAKEN_MESSAGE } from '@/modules/llm-keys/constants/llm-key-error.constants';
import { DomainErrorKind } from '@/platform/errors/constants/domain-error.constants';
import { DomainError } from '@/platform/errors/errors/domain.error';

export class LlmKeyNameTakenError extends DomainError {
  readonly kind = DomainErrorKind.Conflict;
  readonly reason = ErrorReason.LlmKeyNameTaken;

  constructor() {
    super(LLM_KEY_NAME_TAKEN_MESSAGE);
  }
}
