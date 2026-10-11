import { ErrorReason } from '@agent-ic/contracts';
import { DomainErrorKind } from '@/platform/errors/constants/domain-error.constants';
import { DomainError } from '@/platform/errors/errors/domain.error';
import { OUTBOUND_ADDRESS_BLOCKED_MESSAGE } from '@/platform/outbound-http/constants/outbound-http.constants';

export class OutboundAddressBlockedError extends DomainError {
  readonly kind = DomainErrorKind.Forbidden;
  readonly reason = ErrorReason.OutboundAddressBlocked;

  constructor() {
    super(OUTBOUND_ADDRESS_BLOCKED_MESSAGE);
  }
}
