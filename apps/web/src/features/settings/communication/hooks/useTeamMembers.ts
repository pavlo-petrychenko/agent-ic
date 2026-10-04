import { useQuery } from '@apollo/client/react';
import { useMemo } from 'react';
import { TeamMembersDocument } from '@/features/settings/communication/gql/query/teamMembers.generated';
import { toTeamMembers } from '@/features/settings/communication/helpers/member.helpers';
import { MEMBERS_PAGE_SIZE } from '@/features/settings/constants/member.constants';
import type { UseTeamMembersResult } from '@/features/settings/typedefs/member.typedefs';

export function useTeamMembers(): UseTeamMembersResult {
  const { data, loading } = useQuery(TeamMembersDocument, {
    variables: { first: MEMBERS_PAGE_SIZE },
    fetchPolicy: 'network-only',
  });
  const members = useMemo(() => (data === undefined ? [] : toTeamMembers(data)), [data]);
  return { members, loading };
}
