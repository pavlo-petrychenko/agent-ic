import type { ErrorCode, ErrorReason } from '@agent-ic/contracts';

export interface FieldIssue {
  readonly path: string;
  readonly reason: ErrorReason;
}

export interface DomainErrorOptions {
  readonly details?: Readonly<Record<string, unknown>>;
  readonly fields?: readonly FieldIssue[];
  readonly cause?: unknown;
}

export interface UpstreamErrorOptions {
  readonly retryable: boolean;
  readonly cause?: unknown;
}

export interface ErrorDescription {
  readonly code: ErrorCode;
  readonly reason: ErrorReason;
  readonly message: string;
  readonly status: number;
  readonly fields: readonly FieldIssue[];
}

export interface GraphqlErrorExtensions {
  readonly code: ErrorCode;
  readonly reason: ErrorReason;
  readonly traceId: string;
  readonly fields?: readonly FieldIssue[];
  readonly http: { readonly status: number };
}

export interface ProblemDetails {
  readonly type: string;
  readonly title: string;
  readonly status: number;
  readonly detail: string;
  readonly instance: string;
  readonly code: ErrorCode;
  readonly reason: ErrorReason;
  readonly traceId: string;
  readonly errors?: readonly FieldIssue[];
}
