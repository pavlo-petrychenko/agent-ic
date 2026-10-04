import type { WorkspaceRole } from '@agent-ic/contracts';

export interface WorkspaceAccess {
  readonly userId: string;
  readonly workspaceId: string;
  readonly role: WorkspaceRole;
}

export interface ResolvedWorkspace {
  readonly workspaceId: string | null;
  readonly workspaceRole: WorkspaceRole | null;
}
