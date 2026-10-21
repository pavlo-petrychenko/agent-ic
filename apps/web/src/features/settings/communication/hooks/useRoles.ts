import { useQuery } from '@apollo/client/react';
import { useMemo } from 'react';
import { RolesDocument } from '@/features/settings/communication/gql/query/roles.generated';
import { toRoles } from '@/features/settings/communication/helpers/role.helpers';
import type { UseRolesResult } from '@/features/settings/typedefs/role.typedefs';

export function useRoles(): UseRolesResult {
  const { data, loading } = useQuery(RolesDocument, { fetchPolicy: 'network-only' });
  const roles = useMemo(() => (data === undefined ? [] : toRoles(data)), [data]);
  return { roles, loading };
}
