import type { RolesQuery } from '@/features/settings/communication/gql/query/roles.generated';
import type { AppRole } from '@/features/settings/typedefs/role.typedefs';
import { ROLE_FROM_API } from '@/shared/api/constants/workspaceRole.constants';
import type { WorkspaceRole as ApiWorkspaceRole } from '@/shared/api/generated/schema.generated';
import { toResourcePermissions } from '@/shared/api/helpers/permission.helpers';
import type { ApiPermission } from '@/shared/api/helpers/permission.helpers';

interface RoleNode {
  readonly id: string;
  readonly key: ApiWorkspaceRole;
  readonly name: string | null;
  readonly description: string | null;
  readonly isSystem: boolean;
  readonly memberCount: number;
  readonly permissions: readonly ApiPermission[];
}

export const toAppRole = (role: RoleNode): AppRole => ({
  id: role.id,
  key: ROLE_FROM_API[role.key],
  name: role.name,
  description: role.description,
  isSystem: role.isSystem,
  memberCount: role.memberCount,
  permissions: toResourcePermissions(role.permissions),
});

export const toRoles = (data: RolesQuery): readonly AppRole[] => data.roles.map(toAppRole);
