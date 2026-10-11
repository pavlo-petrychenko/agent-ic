import { ErrorReason } from '@agent-ic/contracts';
import { API_REQUEST_FAILED_MESSAGE } from '@/modules/runs/constants/run-error.constants';
import { DomainErrorKind } from '@/platform/errors/constants/domain-error.constants';
import { DomainError } from '@/platform/errors/errors/domain.error';
import type { OutboundHttpResult } from '@/platform/outbound-http/typedefs/outbound-http.typedefs';

export class ApiRequestFailedError extends DomainError {
  readonly kind = DomainErrorKind.PreconditionFailed;
  readonly reason = ErrorReason.ApiRequestFailed;

  constructor(nodeId: string, { outcome, status }: OutboundHttpResult) {
    super(API_REQUEST_FAILED_MESSAGE, { details: { nodeId, outcome, status } });
  }
}
