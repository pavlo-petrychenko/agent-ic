import type { ErrorReason } from '@agent-ic/contracts';
import type { DomainErrorKind } from '@/platform/errors/errors.constants';
import type { DomainErrorOptions, FieldIssue } from '@/platform/errors/errors.typedefs';

export abstract class DomainError extends Error {
  abstract readonly kind: DomainErrorKind;
  abstract readonly reason: ErrorReason;
  readonly details: Readonly<Record<string, unknown>>;
  readonly fields: readonly FieldIssue[];

  constructor(message: string, options: DomainErrorOptions = {}) {
    super(message, { cause: options.cause });
    this.name = new.target.name;
    this.details = options.details ?? {};
    this.fields = options.fields ?? [];
  }
}
