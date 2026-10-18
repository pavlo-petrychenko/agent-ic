import type { ResourcePermissions, WorkspaceRole } from '@agent-ic/contracts';
import { useMutation } from '@apollo/client/react';
import { useCallback } from 'react';
import { CreateRoleDocument } from '@/features/settings/communication/gql/mutation/createRole.generated';
import { RolesDocument } from '@/features/settings/communication/gql/query/roles.generated';
import { toAppRole } from '@/features/settings/communication/helpers/role.helpers';
import type { AppRole } from '@/features/settings/typedefs/role.typedefs';
import { ROLE_TO_API } from '@/shared/api/constants/workspaceRole.constants';
import { toPermissionInputs } from '@/shared/api/helpers/permission.helpers';

export interface CreateRoleRequest {
  readonly name: string;
  readonly baseRole: WorkspaceRole;
  readonly description: string | null;
  readonly permissions: ResourcePermissions;
}

export function useCreateRole(): (request: CreateRoleRequest) => Promise<AppRole | null> {
  const [createRole] = useMutation(CreateRoleDocument, {
    refetchQueries: [RolesDocument],
    awaitRefetchQueries: true,
  });

  return useCallback(
    async (request) => {
      const { data } = await createRole({
        variables: {
          input: {
            name: request.name,
            baseRole: ROLE_TO_API[request.baseRole],
            description: request.description,
            permissions: toPermissionInputs(request.permissions),
          },
        },
      });
      return data === undefined ? null : toAppRole(data.createRole);
    },
    [createRole],
  );
}
