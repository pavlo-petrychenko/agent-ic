import { ErrorReason } from '@agent-ic/contracts';
import { STEP_MODEL_UNKNOWN_MESSAGE } from '@/modules/runs/constants/run-error.constants';
import { DomainErrorKind } from '@/platform/errors/constants/domain-error.constants';
import { DomainError } from '@/platform/errors/errors/domain.error';

export class StepModelUnknownError extends DomainError {
  readonly kind = DomainErrorKind.PreconditionFailed;
  readonly reason = ErrorReason.StepModelUnknown;

  constructor(nodeId: string, model: string) {
    super(STEP_MODEL_UNKNOWN_MESSAGE, { details: { nodeId, model } });
  }
}
