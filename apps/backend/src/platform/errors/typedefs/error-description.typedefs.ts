import type { ErrorCode, ErrorReason } from '@agent-ic/contracts';
import type { FieldIssue } from '@/platform/errors/typedefs/domain-error.typedefs';

export interface ErrorDescription {
  readonly code: ErrorCode;
  readonly reason: ErrorReason;
  readonly message: string;
  readonly status: number;
  readonly fields: readonly FieldIssue[];
  readonly details: Readonly<Record<string, unknown>>;
}
