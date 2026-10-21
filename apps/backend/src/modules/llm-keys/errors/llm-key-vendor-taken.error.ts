import { ErrorReason } from '@agent-ic/contracts';
import { LLM_KEY_VENDOR_TAKEN_MESSAGE } from '@/modules/llm-keys/constants/llm-key-error.constants';
import { DomainErrorKind } from '@/platform/errors/constants/domain-error.constants';
import { DomainError } from '@/platform/errors/errors/domain.error';

export class LlmKeyVendorTakenError extends DomainError {
  readonly kind = DomainErrorKind.Conflict;
  readonly reason = ErrorReason.LlmKeyVendorTaken;

  constructor() {
    super(LLM_KEY_VENDOR_TAKEN_MESSAGE);
  }
}
