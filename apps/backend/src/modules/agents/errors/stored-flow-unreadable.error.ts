import { ErrorReason } from '@agent-ic/contracts';
import type { ParseFlowFailure } from '@agent-ic/flow';
import { STORED_FLOW_UNREADABLE_MESSAGE } from '@/modules/agents/constants/agent-error.constants';
import { DomainErrorKind } from '@/platform/errors/constants/domain-error.constants';
import { DomainError } from '@/platform/errors/errors/domain.error';

export class StoredFlowUnreadableError extends DomainError {
  readonly kind = DomainErrorKind.PreconditionFailed;
  readonly reason = ErrorReason.StoredFlowUnreadable;

  constructor(versionId: string, failure: ParseFlowFailure) {
    super(STORED_FLOW_UNREADABLE_MESSAGE, { details: { versionId, failure } });
  }
}
