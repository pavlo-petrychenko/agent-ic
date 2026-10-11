import { ErrorReason } from '@agent-ic/contracts';
import { WORKSPACE_NAME_MISMATCH_MESSAGE } from '@/modules/identity/constants/workspace-error.constants';
import { DomainErrorKind } from '@/platform/errors/constants/domain-error.constants';
import { DomainError } from '@/platform/errors/errors/domain.error';

export class WorkspaceNameMismatchError extends DomainError {
  readonly kind = DomainErrorKind.ValidationFailed;
  readonly reason = ErrorReason.WorkspaceNameMismatch;

  constructor() {
    super(WORKSPACE_NAME_MISMATCH_MESSAGE);
  }
}
