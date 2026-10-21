import type { WorkspaceRole } from '@agent-ic/contracts';

export interface WorkspaceAccess {
  readonly userId: string;
  readonly workspaceId: string;
  readonly role: WorkspaceRole;
}

export interface MemberAccess {
  readonly workspaceId: string;
  readonly role: WorkspaceRole;
  readonly permissions: ReadonlySet<string>;
}

export interface ResolvedWorkspace {
  readonly workspaceId: string | null;
  readonly workspaceRole: WorkspaceRole | null;
  readonly permissions: ReadonlySet<string>;
}
