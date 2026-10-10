import type { ErrorCode, ErrorReason } from '@agent-ic/contracts';
import type { FieldIssue } from '@/platform/errors/typedefs/domain-error.typedefs';

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
  readonly details?: Readonly<Record<string, unknown>>;
}
