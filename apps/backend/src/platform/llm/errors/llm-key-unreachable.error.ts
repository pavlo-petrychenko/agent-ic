import { ErrorReason } from '@agent-ic/contracts';
import type { LlmKeyVendor } from '@agent-ic/contracts';
import { DomainErrorKind } from '@/platform/errors/constants/domain-error.constants';
import { DomainError } from '@/platform/errors/errors/domain.error';
import { LLM_KEY_UNREACHABLE_MESSAGE } from '@/platform/llm/constants/llm-gateway.constants';
import type { OutboundHttpOutcome } from '@/platform/outbound-http/constants/outbound-http.constants';

export class LlmKeyUnreachableError extends DomainError {
  readonly kind = DomainErrorKind.PreconditionFailed;
  readonly reason = ErrorReason.LlmKeyUnreachable;

  constructor(vendor: LlmKeyVendor, outcome: OutboundHttpOutcome, status: number | null) {
    super(LLM_KEY_UNREACHABLE_MESSAGE, { details: { vendor, outcome, status } });
  }
}
