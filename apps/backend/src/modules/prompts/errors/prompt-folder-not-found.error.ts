import { ErrorReason } from '@agent-ic/contracts';
import { PROMPT_FOLDER_NOT_FOUND_MESSAGE } from '@/modules/prompts/constants/prompt-error.constants';
import { DomainErrorKind } from '@/platform/errors/constants/domain-error.constants';
import { DomainError } from '@/platform/errors/errors/domain.error';

export class PromptFolderNotFoundError extends DomainError {
  readonly kind = DomainErrorKind.NotFound;
  readonly reason = ErrorReason.InvalidId;

  constructor() {
    super(PROMPT_FOLDER_NOT_FOUND_MESSAGE);
  }
}
