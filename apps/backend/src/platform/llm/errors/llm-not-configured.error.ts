import { ErrorReason } from '@agent-ic/contracts';
import { DomainErrorKind } from '@/platform/errors/constants/domain-error.constants';
import { DomainError } from '@/platform/errors/errors/domain.error';
import { LLM_NOT_CONFIGURED_MESSAGE } from '@/platform/llm/constants/llm-gateway.constants';
import type { LlmProviderKind } from '@/platform/llm/constants/llm-provider.constants';

export class LlmNotConfiguredError extends DomainError {
  readonly kind = DomainErrorKind.PreconditionFailed;
  readonly reason = ErrorReason.LlmNotConfigured;

  constructor(provider: LlmProviderKind) {
    super(LLM_NOT_CONFIGURED_MESSAGE, { details: { provider } });
  }
}
