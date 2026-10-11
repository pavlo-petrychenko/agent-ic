import { ErrorReason } from '@agent-ic/contracts';
import { TEAM_MEMBER_NOT_FOUND_MESSAGE } from '@/modules/identity/constants/workspace-error.constants';
import { DomainErrorKind } from '@/platform/errors/constants/domain-error.constants';
import { DomainError } from '@/platform/errors/errors/domain.error';

export class TeamMemberNotFoundError extends DomainError {
  readonly kind = DomainErrorKind.NotFound;
  readonly reason = ErrorReason.TeamMemberNotFound;

  constructor(membershipId: string) {
    super(TEAM_MEMBER_NOT_FOUND_MESSAGE, { details: { membershipId } });
  }
}
