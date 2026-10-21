import { ErrorReason } from '@agent-ic/contracts';
import { ROLE_REPLACEMENT_INVALID_MESSAGE } from '@/modules/identity/constants/workspace-error.constants';
import { DomainErrorKind } from '@/platform/errors/constants/domain-error.constants';
import { DomainError } from '@/platform/errors/errors/domain.error';

export class RoleReplacementInvalidError extends DomainError {
  readonly kind = DomainErrorKind.ValidationFailed;
  readonly reason = ErrorReason.RoleReplacementInvalid;

  constructor(roleId: string) {
    super(ROLE_REPLACEMENT_INVALID_MESSAGE, { details: { roleId } });
  }
}
