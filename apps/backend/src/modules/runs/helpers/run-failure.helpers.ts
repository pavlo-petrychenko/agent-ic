import type { RunFailure } from '@/modules/runs/typedefs/run.typedefs';
import type { DomainError } from '@/platform/errors/errors/domain.error';

export const runFailureOf = (error: DomainError, nodeId: string | null): RunFailure => ({
  reason: error.reason,
  message: error.message,
  nodeId,
});
