import { useQuery } from '@apollo/client/react';
import { useMemo } from 'react';
import { MembersByRoleDocument } from '@/features/flow-builder/communication/gql/query/membersByRole.generated';
import { toRoleCounts } from '@/features/flow-builder/communication/helpers/memberCount.helpers';
import type { RoleCounts } from '@/features/flow-builder/typedefs/escalation.typedefs';

export function useMembersByRole(skip: boolean): RoleCounts | null {
  const { data } = useQuery(MembersByRoleDocument, { skip });
  return useMemo(() => (data === undefined ? null : toRoleCounts(data)), [data]);
}
