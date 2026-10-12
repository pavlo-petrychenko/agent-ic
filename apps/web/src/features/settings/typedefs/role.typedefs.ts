import type { PermissionAction } from '@agent-ic/contracts';

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
