import { useQuery } from '@apollo/client/react';
import { InboxCurrentUserDocument } from '@/features/inbox/communication/gql/query/inboxCurrentUser.generated';
import type { InboxCurrentUser } from '@/features/inbox/typedefs/inbox.typedefs';

export function useInboxCurrentUser(): InboxCurrentUser | null {
  const { data } = useQuery(InboxCurrentUserDocument);

  return data?.me ?? null;
}
