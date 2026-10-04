import { ErrorReason } from '@agent-ic/contracts';
import type { PermissionAction, PermissionResource } from '@agent-ic/contracts';
import { PERMISSION_DENIED_MESSAGE } from '@/platform/context/constants/workspace-access.constants';
import { DomainErrorKind } from '@/platform/errors/constants/domain-error.constants';
import { DomainError } from '@/platform/errors/errors/domain.error';

export class PermissionDeniedError extends DomainError {
  readonly kind = DomainErrorKind.Forbidden;
  readonly reason = ErrorReason.PermissionDenied;

  constructor(resource: PermissionResource, action: PermissionAction) {
    super(PERMISSION_DENIED_MESSAGE, { details: { resource, action } });
  }
}
