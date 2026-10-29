import { ErrorReason } from '@agent-ic/contracts';
import { SCHEDULE_RUN_BUSY_MESSAGE } from '@/modules/runs/constants/run-error.constants';
import { DomainErrorKind } from '@/platform/errors/constants/domain-error.constants';
import { DomainError } from '@/platform/errors/errors/domain.error';

export class ScheduleRunBusyError extends DomainError {
  readonly kind = DomainErrorKind.Conflict;
  readonly reason = ErrorReason.ScheduleRunBusy;

  constructor() {
    super(SCHEDULE_RUN_BUSY_MESSAGE);
  }
}
