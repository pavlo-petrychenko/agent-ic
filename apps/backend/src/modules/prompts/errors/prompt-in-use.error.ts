import { ErrorReason } from '@agent-ic/contracts';
import { PROMPT_IN_USE_MESSAGE } from '@/modules/prompts/constants/prompt-error.constants';
import { DomainErrorKind } from '@/platform/errors/constants/domain-error.constants';
import { DomainError } from '@/platform/errors/errors/domain.error';

export class PromptInUseError extends DomainError {
  readonly kind = DomainErrorKind.Conflict;
  readonly reason = ErrorReason.PromptInUse;

  constructor(usageCount: number) {
    super(PROMPT_IN_USE_MESSAGE, { details: { usageCount } });
  }
}
