import type { WorkspaceRole } from '@agent-ic/contracts';

export interface InviteLinkView {
  readonly url: string;
  readonly role: WorkspaceRole;
  readonly expiresAt: string;
  readonly joinedCount: number;
}

export interface UseInviteLinkResult {
  readonly link: InviteLinkView | null;
  readonly loading: boolean;
  readonly changeRole: (role: WorkspaceRole) => Promise<void>;
  readonly reset: () => Promise<void>;
}
