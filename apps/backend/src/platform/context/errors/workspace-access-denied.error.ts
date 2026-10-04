import { ErrorReason } from '@agent-ic/contracts';
import { WORKSPACE_ACCESS_DENIED_MESSAGE } from '@/platform/context/constants/workspace-access.constants';
import { DomainErrorKind } from '@/platform/errors/constants/domain-error.constants';
import { DomainError } from '@/platform/errors/errors/domain.error';

export class WorkspaceAccessDeniedError extends DomainError {
  readonly kind = DomainErrorKind.Forbidden;
  readonly reason = ErrorReason.WorkspaceAccessDenied;

  constructor() {
    super(WORKSPACE_ACCESS_DENIED_MESSAGE);
  }
}
