import { ErrorReason } from '@agent-ic/contracts';
import { STEP_PROMPT_UNAVAILABLE_MESSAGE } from '@/modules/runs/constants/run-error.constants';
import { DomainErrorKind } from '@/platform/errors/constants/domain-error.constants';
import { DomainError } from '@/platform/errors/errors/domain.error';

export class StepPromptUnavailableError extends DomainError {
  readonly kind = DomainErrorKind.PreconditionFailed;
  readonly reason = ErrorReason.StepPromptUnavailable;

  constructor(nodeId: string, promptRef: string | null) {
    super(STEP_PROMPT_UNAVAILABLE_MESSAGE, { details: { nodeId, promptRef } });
  }
}
