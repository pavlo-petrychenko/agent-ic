import type { MockLink } from '@apollo/client/testing';
import { MembersByRoleDocument } from '@/features/flow-builder/communication/gql/query/membersByRole.generated';
import { WorkspaceRole } from '@/shared/api/generated/schema.generated';

export const membersByRoleMock = (): MockLink.MockedResponse => ({
  request: { query: MembersByRoleDocument },
  result: {
    data: {
      membersByRole: [
        { role: WorkspaceRole.Owner, count: 1 },
        { role: WorkspaceRole.Operator, count: 2 },
      ],
    },
  },
});
