import { ROLE_NAME_MAX_LENGTH, WorkspaceRole } from '@agent-ic/contracts';
import { z } from 'zod';
import { RoleField } from '@/modules/identity/constants/role.constants';

const roleNameSchema = z.string().trim().min(1).max(ROLE_NAME_MAX_LENGTH);

export const createRoleInputSchema = z.object({
  [RoleField.Name]: roleNameSchema,
  [RoleField.BaseRole]: z.enum(WorkspaceRole),
});
