import type { ResourcePermissions } from '@agent-ic/contracts';
import { useMutation } from '@apollo/client/react';
import { useCallback } from 'react';
import { UpdateRolePermissionsDocument } from '@/features/settings/communication/gql/mutation/updateRolePermissions.generated';
import { RolesDocument } from '@/features/settings/communication/gql/query/roles.generated';
import { toPermissionInputs } from '@/shared/api/helpers/permission.helpers';

export function useUpdateRolePermissions(): (
  roleId: string,
  permissions: ResourcePermissions,
) => Promise<void> {
  const [updatePermissions] = useMutation(UpdateRolePermissionsDocument, {
    refetchQueries: [RolesDocument],
    awaitRefetchQueries: true,
  });

  return useCallback(
    async (roleId, permissions) => {
      await updatePermissions({
        variables: { input: { roleId, permissions: toPermissionInputs(permissions) } },
      });
    },
    [updatePermissions],
  );
}
