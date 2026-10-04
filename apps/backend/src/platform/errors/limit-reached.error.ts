import { DomainError } from './domain.error';
import { DomainErrorKind } from './errors.constants';
import type { LimitScope } from './errors.constants';

export abstract class LimitReachedError extends DomainError {
  readonly kind = DomainErrorKind.LimitReached;
  abstract readonly scope: LimitScope;
}
