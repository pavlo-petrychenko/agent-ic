import type { InviteLinkQuery } from '@/features/settings/communication/gql/query/inviteLink.generated';
import type { InviteLinkView } from '@/features/settings/typedefs/inviteLink.typedefs';
import { ROLE_FROM_API } from '@/shared/api/constants/workspaceRole.constants';

type ApiInviteLink = NonNullable<InviteLinkQuery['inviteLink']>;

export const toInviteLinkView = (link: ApiInviteLink | null): InviteLinkView | null =>
  link === null
    ? null
    : {
        url: link.url,
        role: ROLE_FROM_API[link.role],
        expiresAt: link.expiresAt,
        joinedCount: link.joinedCount,
      };
