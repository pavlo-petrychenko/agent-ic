import type { MembersByRoleQuery } from '@/features/flow-builder/communication/gql/query/membersByRole.generated';
import { ROLE_FROM_API } from '@/features/flow-builder/constants/escalation.constants';
import type { RoleCounts } from '@/features/flow-builder/typedefs/escalation.typedefs';

export const toRoleCounts = (data: MembersByRoleQuery): RoleCounts =>
  new Map(data.membersByRole.map(({ role, count }) => [ROLE_FROM_API[role], count]));
