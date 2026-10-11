import { ErrorReason } from '@agent-ic/contracts';
import { RUN_FLOW_INVALID_MESSAGE } from '@/modules/runs/constants/run-error.constants';
import { DomainErrorKind } from '@/platform/errors/constants/domain-error.constants';
import { DomainError } from '@/platform/errors/errors/domain.error';

export class RunFlowInvalidError extends DomainError {
  readonly kind = DomainErrorKind.PreconditionFailed;
  readonly reason = ErrorReason.RunFlowInvalid;

  constructor(versionId: string, nodeId: string | null) {
    super(RUN_FLOW_INVALID_MESSAGE, { details: { versionId, nodeId } });
  }
}
