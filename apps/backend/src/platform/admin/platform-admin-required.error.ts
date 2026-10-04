import { ErrorReason } from '@agent-ic/contracts';
import { PLATFORM_ADMIN_REQUIRED_MESSAGE } from '@/platform/admin/admin.constants';
import { DomainErrorKind } from '@/platform/errors/constants/domain-error.constants';
import { DomainError } from '@/platform/errors/errors/domain.error';

export class PlatformAdminRequiredError extends DomainError {
  readonly kind = DomainErrorKind.Forbidden;
  readonly reason = ErrorReason.PlatformAdminRequired;

  constructor() {
    super(PLATFORM_ADMIN_REQUIRED_MESSAGE);
  }
}
