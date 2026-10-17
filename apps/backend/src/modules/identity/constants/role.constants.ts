import { ErrorReason, WorkspaceRole } from '@agent-ic/contracts';

export enum RoleField {
  Name = 'name',
  BaseRole = 'baseRole',
  RoleId = 'roleId',
  Permissions = 'permissions',
}

export const ROLE_FIELD_REASON: Readonly<Record<string, ErrorReason>> = {
  [RoleField.Name]: ErrorReason.InvalidRoleName,
};

export const SYSTEM_ROLES: readonly WorkspaceRole[] = Object.values(WorkspaceRole);

export enum RoleGraphqlArgument {
  RoleId = 'roleId',
}
