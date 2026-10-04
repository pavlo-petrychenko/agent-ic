import type { WorkspaceRole } from '@agent-ic/contracts';
import type { workspaces } from '@/modules/identity/db/workspaces.table';

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
}

export interface DirectoryMembership {
  readonly workspaceId: string;
  readonly name: string;
  readonly timeZone: string;
  readonly role: WorkspaceRole;
  readonly memberCount: number;
}
