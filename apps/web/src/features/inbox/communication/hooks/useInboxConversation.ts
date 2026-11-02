import { useQuery } from '@apollo/client/react';
import { useCallback } from 'react';
import { InboxConversationDocument } from '@/features/inbox/communication/gql/query/inboxConversation.generated';

export function useInboxConversation(id: string | null) {
  const { data, loading, error, refetch } = useQuery(InboxConversationDocument, {
    variables: { id: id ?? '' },
    skip: id === null,
    fetchPolicy: 'cache-and-network',
  });
  const retry = useCallback(() => refetch().then(() => undefined), [refetch]);

  return {
    detail: data?.inboxConversation ?? null,
    loading,
    failed: error !== undefined,
    retry,
  };
}
