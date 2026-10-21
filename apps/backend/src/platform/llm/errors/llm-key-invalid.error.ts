import { ErrorReason } from '@agent-ic/contracts';
import type { LlmKeyVendor } from '@agent-ic/contracts';
import { DomainErrorKind } from '@/platform/errors/constants/domain-error.constants';
import { DomainError } from '@/platform/errors/errors/domain.error';
import { LLM_KEY_INVALID_MESSAGE } from '@/platform/llm/constants/llm-gateway.constants';

export class LlmKeyInvalidError extends DomainError {
  readonly kind = DomainErrorKind.PreconditionFailed;
  readonly reason = ErrorReason.LlmKeyInvalid;

  constructor(vendor: LlmKeyVendor, status: number | null) {
    super(LLM_KEY_INVALID_MESSAGE, { details: { vendor, status } });
  }
}
