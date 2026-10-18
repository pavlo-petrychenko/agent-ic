import { ErrorReason } from '@agent-ic/contracts';
import { ROLE_NOT_EDITABLE_MESSAGE } from '@/modules/identity/constants/workspace-error.constants';
import { DomainErrorKind } from '@/platform/errors/constants/domain-error.constants';
import { DomainError } from '@/platform/errors/errors/domain.error';

export class RoleNotEditableError extends DomainError {
  readonly kind = DomainErrorKind.Forbidden;
  readonly reason = ErrorReason.RoleNotEditable;

  constructor(roleId: string) {
    super(ROLE_NOT_EDITABLE_MESSAGE, { details: { roleId } });
  }
}
