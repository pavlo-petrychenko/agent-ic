import type { WorkspaceRole } from '@agent-ic/contracts';

export interface InviteLinkView {
  readonly url: string;
  readonly role: WorkspaceRole;
  readonly roleId: string;
  readonly expiresAt: string;
  readonly joinedCount: number;
}

export interface UseInviteLinkOptions {
  readonly skip: boolean;
}

export interface UseInviteLinkResult {
  readonly link: InviteLinkView | null;
  readonly loading: boolean;
  readonly changeRole: (roleId: string) => Promise<void>;
  readonly reset: () => Promise<void>;
}
