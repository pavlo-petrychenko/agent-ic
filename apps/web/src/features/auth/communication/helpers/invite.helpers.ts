import type { InviteInfoQuery } from '@/features/auth/communication/gql/query/inviteInfo.generated';
import { INVITE_LINK_REASONS } from '@/features/auth/constants/invite.constants';
import type { InviteDetails } from '@/features/auth/typedefs/invite.typedefs';
import { ROLE_FROM_API } from '@/shared/api/constants/workspaceRole.constants';
import { toAppError } from '@/shared/api/helpers/appError.helpers';

export const toInviteDetails = (token: string, data: InviteInfoQuery): InviteDetails => ({
  token,
  workspaceName: data.inviteInfo.workspaceName,
  inviterName: data.inviteInfo.inviterName,
  memberCount: data.inviteInfo.memberCount,
  role: ROLE_FROM_API[data.inviteInfo.role],
});

export const isInviteLinkError = (error: unknown): boolean => {
  const { reason } = toAppError(error);
  return reason !== null && INVITE_LINK_REASONS.has(reason);
};
