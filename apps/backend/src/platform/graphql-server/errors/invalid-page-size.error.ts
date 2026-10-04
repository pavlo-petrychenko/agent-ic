import { ErrorReason } from '@agent-ic/contracts';
import { DomainError } from '@/platform/errors/domain.error';
import { DomainErrorKind } from '@/platform/errors/errors.constants';
import {
  INVALID_PAGE_SIZE_MESSAGE,
  PAGE_SIZE_MAX,
  PAGE_SIZE_MIN,
} from '@/platform/graphql-server/constants/relay.constants';

export class InvalidPageSizeError extends DomainError {
  readonly kind = DomainErrorKind.ValidationFailed;
  readonly reason = ErrorReason.InvalidPageSize;

  constructor(first: number) {
    super(INVALID_PAGE_SIZE_MESSAGE, {
      details: { first, min: PAGE_SIZE_MIN, max: PAGE_SIZE_MAX },
    });
  }
}
