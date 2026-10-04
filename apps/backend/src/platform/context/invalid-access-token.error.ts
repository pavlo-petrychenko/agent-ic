import { ErrorReason } from '@agent-ic/contracts';

import { DomainError } from '@/platform/errors/domain.error';
import { DomainErrorKind } from '@/platform/errors/errors.constants';

import { INVALID_ACCESS_TOKEN_MESSAGE } from './context.constants';

export class InvalidAccessTokenError extends DomainError {
  readonly kind = DomainErrorKind.Unauthenticated;
  readonly reason = ErrorReason.InvalidAccessToken;

  constructor() {
    super(INVALID_ACCESS_TOKEN_MESSAGE);
  }
}
