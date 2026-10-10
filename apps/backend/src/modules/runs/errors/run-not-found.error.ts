import { ErrorReason } from '@agent-ic/contracts';
import { RUN_NOT_FOUND_MESSAGE } from '@/modules/runs/constants/run-error.constants';
import { DomainErrorKind } from '@/platform/errors/constants/domain-error.constants';
import { DomainError } from '@/platform/errors/errors/domain.error';

export class RunNotFoundError extends DomainError {
  readonly kind = DomainErrorKind.NotFound;
  readonly reason = ErrorReason.RunNotFound;

  constructor(runId: string) {
    super(RUN_NOT_FOUND_MESSAGE, { details: { runId } });
  }
}
