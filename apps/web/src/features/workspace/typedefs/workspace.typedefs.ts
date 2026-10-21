import type { Locale, ResourcePermissions, WorkspaceRole } from '@agent-ic/contracts';

export interface WorkspaceSummary {
  readonly id: string;
  readonly name: string;
  readonly timeZone: string;
  readonly memberCount: number;
  readonly role: WorkspaceRole;
  readonly permissions: ResourcePermissions;
}

export interface ShellUser {
  readonly userId: string;
  readonly name: string;
  readonly email: string;
  readonly locale: Locale;
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
