import { ErrorReason } from '@agent-ic/contracts';
import type { LlmKeyVendor } from '@agent-ic/contracts';
import { DomainErrorKind } from '@/platform/errors/constants/domain-error.constants';
import { DomainError } from '@/platform/errors/errors/domain.error';
import { LLM_KEY_ENDPOINT_BLOCKED_MESSAGE } from '@/platform/llm/constants/llm-gateway.constants';

export class LlmKeyEndpointBlockedError extends DomainError {
  readonly kind = DomainErrorKind.PreconditionFailed;
  readonly reason = ErrorReason.LlmKeyEndpointBlocked;

  constructor(vendor: LlmKeyVendor) {
    super(LLM_KEY_ENDPOINT_BLOCKED_MESSAGE, { details: { vendor } });
  }
}
