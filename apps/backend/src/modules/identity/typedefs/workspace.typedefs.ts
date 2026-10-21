import type { WorkspaceRole } from '@agent-ic/contracts';
import type { workspaces } from '@/modules/identity/db/workspaces.table';
import type { RolePermission } from '@/modules/identity/typedefs/role.typedefs';

export type WorkspaceRecord = typeof workspaces.$inferSelect;

export type NewWorkspace = typeof workspaces.$inferInsert;

export interface CreateWorkspaceInput {
  readonly name: string;
  readonly timeZone: string;
}

export interface WorkspaceSummary {
  readonly id: string;
  readonly name: string;
  readonly timeZone: string;
  readonly memberCount: number;
}

export interface WorkspaceMembership {
  readonly workspace: WorkspaceSummary;
  readonly role: WorkspaceRole;
  readonly permissions: readonly RolePermission[];
}

export interface DirectoryMembership {
  readonly workspaceId: string;
  readonly name: string;
  readonly timeZone: string;
  readonly role: WorkspaceRole;
  readonly permissions: readonly RolePermission[];
  readonly memberCount: number;
}

export interface WorkspaceIdInput {
  readonly workspaceId: string;
}

export interface RenameWorkspaceInput {
  readonly name: string;
}

export interface UpdateTimeZoneInput {
  readonly timeZone: string;
}

export interface TransferOwnershipInput {
  readonly membershipId: string;
  readonly password: string;
}

export interface DeleteWorkspaceInput {
  readonly name: string;
  readonly password: string;
}

export type WorkspaceDeletedInput = {
  readonly workspaceId: string;
};

export interface RemoveMemberInput {
  readonly membershipId: string;
}

export interface ChangeMemberRoleInput {
  readonly membershipId: string;
  readonly role: WorkspaceRole;
}
