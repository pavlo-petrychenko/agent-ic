import type { TeamMembersQuery } from '@/features/settings/communication/gql/query/teamMembers.generated';
import type { TeamMember } from '@/features/settings/typedefs/member.typedefs';
import { ROLE_FROM_API } from '@/shared/api/constants/workspaceRole.constants';

export const toTeamMembers = (data: TeamMembersQuery): readonly TeamMember[] =>
  data.members.edges.map(({ node }) => ({
    id: node.id,
    name: node.name,
    email: node.email,
    role: ROLE_FROM_API[node.role],
    lastActiveAt: node.lastActiveAt,
  }));
