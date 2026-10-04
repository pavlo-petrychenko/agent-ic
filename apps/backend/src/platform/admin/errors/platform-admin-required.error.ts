import { ErrorReason } from '@agent-ic/contracts';
import { PLATFORM_ADMIN_REQUIRED_MESSAGE } from '@/platform/admin/constants/admin.constants';
import { DomainError } from '@/platform/errors/domain.error';
import { DomainErrorKind } from '@/platform/errors/errors.constants';

export class PlatformAdminRequiredError extends DomainError {
  readonly kind = DomainErrorKind.Forbidden;
  readonly reason = ErrorReason.PlatformAdminRequired;

  constructor() {
    super(PLATFORM_ADMIN_REQUIRED_MESSAGE);
  }
}
