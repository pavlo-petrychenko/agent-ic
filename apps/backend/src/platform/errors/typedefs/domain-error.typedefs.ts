import type { ErrorReason } from '@agent-ic/contracts';

export interface FieldIssue {
  readonly path: string;
  readonly reason: ErrorReason;
}

export interface DomainErrorOptions {
  readonly details?: Readonly<Record<string, unknown>>;
  readonly clientDetails?: Readonly<Record<string, unknown>>;
  readonly fields?: readonly FieldIssue[];
  readonly cause?: unknown;
}
