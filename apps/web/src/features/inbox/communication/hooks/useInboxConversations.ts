import { useQuery } from '@apollo/client/react';
import { useCallback } from 'react';
import { InboxConversationsDocument } from '@/features/inbox/communication/gql/query/inboxConversations.generated';
import { INBOX_CONVERSATIONS_FETCH_LIMIT } from '@/features/inbox/constants/inbox.constants';

export function useInboxConversations() {
  const { data, loading, error, refetch } = useQuery(InboxConversationsDocument, {
    variables: { limit: INBOX_CONVERSATIONS_FETCH_LIMIT },
    fetchPolicy: 'cache-and-network',
  });
  const retry = useCallback(() => refetch().then(() => undefined), [refetch]);

  return {
    summaries: data?.inboxConversations ?? [],
    loading,
    failed: error !== undefined,
    retry,
  };
}
