import { ErrorReason } from '@agent-ic/contracts';
import { PROMPT_VERSION_NOT_FOUND_MESSAGE } from '@/modules/prompts/constants/prompt-error.constants';
import { DomainErrorKind } from '@/platform/errors/constants/domain-error.constants';
import { DomainError } from '@/platform/errors/errors/domain.error';

export class PromptVersionNotFoundError extends DomainError {
  readonly kind = DomainErrorKind.NotFound;
  readonly reason = ErrorReason.InvalidId;

  constructor() {
    super(PROMPT_VERSION_NOT_FOUND_MESSAGE);
  }
}
