import type { ErrorCode, ErrorReason } from '@agent-ic/contracts';
import type { FieldIssue } from '@/platform/errors/typedefs/domain-error.typedefs';

export interface GraphqlErrorExtensions {
  readonly code: ErrorCode;
  readonly reason: ErrorReason;
  readonly traceId: string;
  readonly fields?: readonly FieldIssue[];
  readonly details?: Readonly<Record<string, unknown>>;
  readonly http: { readonly status: number };
}
