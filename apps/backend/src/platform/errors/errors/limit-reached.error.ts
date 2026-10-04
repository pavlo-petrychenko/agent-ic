import { DomainErrorKind } from '@/platform/errors/constants/domain-error.constants';
import type { LimitScope } from '@/platform/errors/constants/domain-error.constants';
import { DomainError } from '@/platform/errors/errors/domain.error';

export abstract class LimitReachedError extends DomainError {
  readonly kind = DomainErrorKind.LimitReached;
  abstract readonly scope: LimitScope;
}
