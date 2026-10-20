import { ErrorReason } from '@agent-ic/contracts';
import { PROMPT_FOLDER_NOT_EMPTY_MESSAGE } from '@/modules/prompts/constants/prompt-error.constants';
import { DomainErrorKind } from '@/platform/errors/constants/domain-error.constants';
import { DomainError } from '@/platform/errors/errors/domain.error';

export class PromptFolderNotEmptyError extends DomainError {
  readonly kind = DomainErrorKind.Conflict;
  readonly reason = ErrorReason.PromptFolderNotEmpty;

  constructor(promptCount: number) {
    super(PROMPT_FOLDER_NOT_EMPTY_MESSAGE, { details: { promptCount } });
  }
}
