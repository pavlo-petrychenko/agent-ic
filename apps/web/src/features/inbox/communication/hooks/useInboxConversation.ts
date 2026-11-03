import { useQuery } from '@apollo/client/react';
import { InboxConversationDocument } from '@/features/inbox/communication/gql/query/inboxConversation.generated';

export function useInboxConversation(id: string | null) {
  const { data, loading, error } = useQuery(InboxConversationDocument, {
    variables: { id: id ?? '' },
    skip: id === null,
    fetchPolicy: 'cache-and-network',
  });

  return {
    detail: data?.inboxConversation ?? null,
    loading,
    failed: error !== undefined,
  };
}
