import type { WorkspaceRole } from '@agent-ic/contracts';
import type { inviteLinks } from '@/modules/identity/db/invite-links.table';

export type InviteLinkRecord = typeof inviteLinks.$inferSelect;

export type NewInviteLink = Omit<typeof inviteLinks.$inferInsert, 'createdAt'>;

export interface InviteLinkView {
  readonly url: string;
  readonly role: WorkspaceRole;
  readonly roleId: string;
  readonly expiresAt: Date;
  readonly joinedCount: number;
}

export interface DirectoryInvite {
  readonly id: string;
  readonly workspaceId: string;
  readonly role: WorkspaceRole;
  readonly roleId: string;
  readonly expiresAt: Date;
  readonly revokedAt: Date | null;
  readonly workspaceName: string;
  readonly inviterName: string;
  readonly memberCount: number;
}

export interface InviteInfo {
  readonly workspaceName: string;
  readonly inviterName: string;
  readonly memberCount: number;
  readonly role: WorkspaceRole;
  readonly roleId: string;
  readonly expiresAt: Date;
}

export interface InviteTokenInput {
  readonly token: string;
}

export interface UpdateInviteLinkRoleInput {
  readonly role?: WorkspaceRole;
  readonly roleId?: string;
}

export interface DerivedInviteToken {
  readonly token: string;
  readonly hash: string;
}
