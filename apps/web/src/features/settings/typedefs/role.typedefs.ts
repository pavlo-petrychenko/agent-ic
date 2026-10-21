import type { PermissionAction, ResourcePermissions, WorkspaceRole } from '@agent-ic/contracts';

export type RoleMatrixAction =
  | PermissionAction.View
  | PermissionAction.Edit
  | PermissionAction.Publish
  | PermissionAction.Delete;

export interface RoleMatrixColumn {
  readonly id: string;
  readonly label: string;
  readonly action: RoleMatrixAction;
}

export interface RoleMatrixRow {
  readonly id: string;
  readonly label: string;
  readonly note: string | null;
  readonly actions: readonly RoleMatrixAction[];
  readonly granted: readonly PermissionAction[];
}

export interface RoleMatrixContent {
  readonly resourceLabel: string;
  readonly columns: readonly RoleMatrixColumn[];
  readonly rows: readonly RoleMatrixRow[];
}

export interface AppRole {
  readonly id: string;
  readonly key: WorkspaceRole;
  readonly name: string | null;
  readonly description: string | null;
  readonly isSystem: boolean;
  readonly memberCount: number;
  readonly permissions: ResourcePermissions;
}

export interface UseRolesResult {
  readonly roles: readonly AppRole[];
  readonly loading: boolean;
}
