import { ErrorReason } from '@agent-ic/contracts';
import { SYSTEM_ACTOR_REQUIRED_MESSAGE } from '@/platform/context/constants/authentication.constants';
import { DomainErrorKind } from '@/platform/errors/constants/domain-error.constants';
import { DomainError } from '@/platform/errors/errors/domain.error';

export class SystemActorRequiredError extends DomainError {
  readonly kind = DomainErrorKind.Forbidden;
  readonly reason = ErrorReason.SystemActorRequired;

  constructor() {
    super(SYSTEM_ACTOR_REQUIRED_MESSAGE);
  }
}
