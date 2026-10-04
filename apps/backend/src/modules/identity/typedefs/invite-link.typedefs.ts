import type { WorkspaceRole } from '@agent-ic/contracts';
import type { inviteLinks } from '@/modules/identity/db/invite-links.table';

export type InviteLinkRecord = typeof inviteLinks.$inferSelect;

export type NewInviteLink = typeof inviteLinks.$inferInsert;

export interface InviteLinkView {
  readonly url: string;
  readonly role: WorkspaceRole;
  readonly expiresAt: Date;
  readonly joinedCount: number;
}

export interface DirectoryInvite {
  readonly id: string;
  readonly workspaceId: string;
  readonly role: WorkspaceRole;
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
  readonly expiresAt: Date;
}

export interface InviteTokenInput {
  readonly token: string;
}

export interface UpdateInviteLinkRoleInput {
  readonly role: string;
}

export interface DerivedInviteToken {
  readonly token: string;
  readonly hash: string;
}
