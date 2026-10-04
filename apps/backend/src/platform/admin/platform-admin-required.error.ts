import { ErrorReason } from '@agent-ic/contracts';

import { DomainError } from '@/platform/errors/domain.error';
import { DomainErrorKind } from '@/platform/errors/errors.constants';

import { PLATFORM_ADMIN_REQUIRED_MESSAGE } from './admin.constants';

export class PlatformAdminRequiredError extends DomainError {
  readonly kind = DomainErrorKind.Forbidden;
  readonly reason = ErrorReason.PlatformAdminRequired;

  constructor() {
    super(PLATFORM_ADMIN_REQUIRED_MESSAGE);
  }
}
