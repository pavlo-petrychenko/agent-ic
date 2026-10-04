import { ErrorReason } from '@agent-ic/contracts';
import { CROSS_ORIGIN_REQUEST_MESSAGE } from '@/modules/identity/constants/identity-error.constants';
import { DomainErrorKind } from '@/platform/errors/constants/domain-error.constants';
import { DomainError } from '@/platform/errors/errors/domain.error';

export class CrossOriginRequestError extends DomainError {
  readonly kind = DomainErrorKind.Forbidden;
  readonly reason = ErrorReason.CrossOriginRequest;

  constructor() {
    super(CROSS_ORIGIN_REQUEST_MESSAGE);
  }
}
