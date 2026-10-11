import { ErrorReason } from '@agent-ic/contracts';
import { DRAFT_CONFLICT_MESSAGE } from '@/modules/agents/constants/agent-error.constants';
import { DomainErrorKind } from '@/platform/errors/constants/domain-error.constants';
import { DomainError } from '@/platform/errors/errors/domain.error';

export class DraftConflictError extends DomainError {
  readonly kind = DomainErrorKind.Conflict;
  readonly reason = ErrorReason.DraftConflict;

  constructor(savedBy: string | null, savedAt: Date) {
    super(DRAFT_CONFLICT_MESSAGE, {
      clientDetails: { savedBy, savedAt: savedAt.toISOString() },
    });
  }
}
