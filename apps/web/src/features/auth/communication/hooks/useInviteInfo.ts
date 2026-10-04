import { useQuery } from '@apollo/client/react';
import { useMemo } from 'react';
import { InviteInfoDocument } from '@/features/auth/communication/gql/query/inviteInfo.generated';
import {
  isInviteLinkError,
  toInviteDetails,
} from '@/features/auth/communication/helpers/invite.helpers';
import { InviteState } from '@/features/auth/constants/invite.constants';
import type { UseInviteInfoResult } from '@/features/auth/typedefs/invite.typedefs';
import { toAppError } from '@/shared/api/helpers/appError.helpers';
import { useErrorMessage } from '@/shared/i18n/hooks/useErrorMessage';

export function useInviteInfo(token: string): UseInviteInfoResult {
  const errorMessage = useErrorMessage();
  const { data, error } = useQuery(InviteInfoDocument, {
    variables: { token },
    fetchPolicy: 'network-only',
  });

  return useMemo(() => {
    if (error !== undefined) {
      return isInviteLinkError(error)
        ? { state: InviteState.Invalid, invite: null, errorMessage: null }
        : {
            state: InviteState.Failed,
            invite: null,
            errorMessage: errorMessage(toAppError(error)),
          };
    }
    return data === undefined
      ? { state: InviteState.Loading, invite: null, errorMessage: null }
      : { state: InviteState.Ready, invite: toInviteDetails(token, data), errorMessage: null };
  }, [data, error, errorMessage, token]);
}
