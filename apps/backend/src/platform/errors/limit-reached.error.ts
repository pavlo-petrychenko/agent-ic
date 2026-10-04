import { DomainError } from '@/platform/errors/domain.error';
import { DomainErrorKind } from '@/platform/errors/errors.constants';
import type { LimitScope } from '@/platform/errors/errors.constants';

export abstract class LimitReachedError extends DomainError {
  readonly kind = DomainErrorKind.LimitReached;
  abstract readonly scope: LimitScope;
}
