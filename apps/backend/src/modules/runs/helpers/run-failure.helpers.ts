import { ErrorReason } from '@agent-ic/contracts';
import type { RunFailure } from '@/modules/runs/typedefs/run.typedefs';
import { INTERNAL_ERROR_MESSAGE } from '@/platform/errors/constants/error-description.constants';
import { DomainError } from '@/platform/errors/errors/domain.error';
import { UpstreamError } from '@/platform/errors/errors/upstream.error';

export const runFailureOf = (error: unknown, nodeId: string | null): RunFailure =>
  error instanceof DomainError || error instanceof UpstreamError
    ? { reason: error.reason, message: error.message, nodeId }
    : { reason: ErrorReason.Internal, message: INTERNAL_ERROR_MESSAGE, nodeId };
