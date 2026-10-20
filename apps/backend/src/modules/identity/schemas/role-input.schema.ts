import {
  PermissionAction,
  PermissionResource,
  ROLE_DESCRIPTION_MAX_LENGTH,
  ROLE_NAME_MAX_LENGTH,
  WorkspaceRole,
} from '@agent-ic/contracts';
import { z } from 'zod';
import { RoleField } from '@/modules/identity/constants/role.constants';

const roleNameSchema = z.string().trim().min(1).max(ROLE_NAME_MAX_LENGTH);
const roleIdSchema = z.string().min(1);

const rolePermissionSchema = z.object({
  resource: z.enum(PermissionResource),
  action: z.enum(PermissionAction),
});

export const createRoleInputSchema = z.object({
  [RoleField.Name]: roleNameSchema,
  [RoleField.BaseRole]: z.enum(WorkspaceRole),
  [RoleField.Description]: z.string().trim().max(ROLE_DESCRIPTION_MAX_LENGTH).nullish(),
  [RoleField.Permissions]: z.array(rolePermissionSchema).nullish(),
});

export const renameRoleInputSchema = z.object({
  [RoleField.RoleId]: roleIdSchema,
  [RoleField.Name]: roleNameSchema,
});

export const updateRolePermissionsInputSchema = z.object({
  [RoleField.RoleId]: roleIdSchema,
  [RoleField.Permissions]: z.array(rolePermissionSchema),
});

export const deleteRoleInputSchema = z.object({
  [RoleField.RoleId]: roleIdSchema,
});
