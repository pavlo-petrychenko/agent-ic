import { ErrorReason } from '@agent-ic/contracts';
import { API_REQUEST_AUTH_UNSUPPORTED_MESSAGE } from '@/modules/runs/constants/run-error.constants';
import { DomainErrorKind } from '@/platform/errors/constants/domain-error.constants';
import { DomainError } from '@/platform/errors/errors/domain.error';

export class ApiRequestAuthUnsupportedError extends DomainError {
  readonly kind = DomainErrorKind.PreconditionFailed;
  readonly reason = ErrorReason.ApiRequestAuthUnsupported;

  constructor(nodeId: string) {
    super(API_REQUEST_AUTH_UNSUPPORTED_MESSAGE, { details: { nodeId } });
  }
}
