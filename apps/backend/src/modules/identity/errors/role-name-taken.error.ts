import { ErrorReason } from '@agent-ic/contracts';
import { ROLE_NAME_TAKEN_MESSAGE } from '@/modules/identity/constants/workspace-error.constants';
import { DomainErrorKind } from '@/platform/errors/constants/domain-error.constants';
import { DomainError } from '@/platform/errors/errors/domain.error';

export class RoleNameTakenError extends DomainError {
  readonly kind = DomainErrorKind.Conflict;
  readonly reason = ErrorReason.RoleNameTaken;

  constructor(name: string) {
    super(ROLE_NAME_TAKEN_MESSAGE, { details: { name } });
  }
}
