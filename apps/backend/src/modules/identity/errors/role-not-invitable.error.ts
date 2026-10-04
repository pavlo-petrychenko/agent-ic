import { ErrorReason } from '@agent-ic/contracts';
import type { WorkspaceRole } from '@agent-ic/contracts';
import { ROLE_NOT_INVITABLE_MESSAGE } from '@/modules/identity/constants/workspace-error.constants';
import { DomainErrorKind } from '@/platform/errors/constants/domain-error.constants';
import { DomainError } from '@/platform/errors/errors/domain.error';

export class RoleNotInvitableError extends DomainError {
  readonly kind = DomainErrorKind.ValidationFailed;
  readonly reason = ErrorReason.RoleNotInvitable;

  constructor(role: WorkspaceRole) {
    super(ROLE_NOT_INVITABLE_MESSAGE, { details: { role } });
  }
}
