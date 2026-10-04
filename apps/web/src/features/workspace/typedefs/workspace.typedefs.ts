import type { WorkspaceRole } from '@agent-ic/contracts';

export interface WorkspaceSummary {
  readonly id: string;
  readonly name: string;
  readonly memberCount: number;
  readonly role: WorkspaceRole;
}

export interface ShellUser {
  readonly name: string;
  readonly email: string;
}

export interface WorkspaceShellData {
  readonly user: ShellUser;
  readonly workspaces: readonly WorkspaceSummary[];
  readonly active: WorkspaceSummary | null;
}

export interface UseWorkspaceShellResult {
  readonly data: WorkspaceShellData | null;
  readonly loading: boolean;
}
