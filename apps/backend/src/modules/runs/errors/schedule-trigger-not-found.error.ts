import { ErrorReason } from '@agent-ic/contracts';
import { SCHEDULE_TRIGGER_NOT_FOUND_MESSAGE } from '@/modules/runs/constants/run-error.constants';
import { DomainErrorKind } from '@/platform/errors/constants/domain-error.constants';
import { DomainError } from '@/platform/errors/errors/domain.error';

export class ScheduleTriggerNotFoundError extends DomainError {
  readonly kind = DomainErrorKind.NotFound;
  readonly reason = ErrorReason.ScheduleTriggerNotFound;

  constructor(nodeId: string) {
    super(SCHEDULE_TRIGGER_NOT_FOUND_MESSAGE, { details: { nodeId } });
  }
}
