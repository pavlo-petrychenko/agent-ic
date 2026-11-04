import { useMutation } from '@apollo/client/react';
import { useCallback } from 'react';
import { InboxHandBackDocument } from '@/features/inbox/communication/gql/mutation/inboxHandBack.generated';
import { InboxConversationsDocument } from '@/features/inbox/communication/gql/query/inboxConversations.generated';
import { InboxNeedsYouCountDocument } from '@/features/inbox/communication/gql/query/inboxNeedsYouCount.generated';
import { INBOX_CONVERSATIONS_FETCH_LIMIT } from '@/features/inbox/constants/inbox.constants';

export function useHandBack() {
  const [handBackConversation, { loading }] = useMutation(InboxHandBackDocument);

  const handBack = useCallback(
    async (conversationId: string) => {
      await handBackConversation({
        variables: { input: { conversationId } },
        refetchQueries: [
          { query: InboxNeedsYouCountDocument },
          {
            query: InboxConversationsDocument,
            variables: { limit: INBOX_CONVERSATIONS_FETCH_LIMIT },
          },
        ],
        awaitRefetchQueries: true,
      });
    },
    [handBackConversation],
  );

  return { handBack, handingBack: loading };
}
