import type { WorkspaceRole } from '@agent-ic/contracts';
import type { InviteState } from '@/features/auth/constants/invite.constants';

export interface InviteDetails {
  readonly token: string;
  readonly workspaceName: string;
  readonly inviterName: string;
  readonly memberCount: number;
  readonly role: WorkspaceRole;
}

export interface UseInviteInfoResult {
  readonly state: InviteState;
  readonly invite: InviteDetails | null;
  readonly errorMessage: string | null;
}
