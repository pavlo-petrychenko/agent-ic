import { ErrorReason } from '@agent-ic/contracts';
import { PROMPT_FOLDER_NAME_TAKEN_MESSAGE } from '@/modules/prompts/constants/prompt-error.constants';
import { DomainErrorKind } from '@/platform/errors/constants/domain-error.constants';
import { DomainError } from '@/platform/errors/errors/domain.error';

export class PromptFolderNameTakenError extends DomainError {
  readonly kind = DomainErrorKind.Conflict;
  readonly reason = ErrorReason.PromptFolderNameTaken;

  constructor() {
    super(PROMPT_FOLDER_NAME_TAKEN_MESSAGE);
  }
}
