import { useMutation } from '@apollo/client/react';
import { useCallback } from 'react';
import { InboxHandBackDocument } from '@/features/inbox/communication/gql/mutation/inboxHandBack.generated';
import { InboxNeedsYouCountDocument } from '@/features/inbox/communication/gql/query/inboxNeedsYouCount.generated';

export function useHandBack() {
  const [handBackConversation, { loading }] = useMutation(InboxHandBackDocument);

  const handBack = useCallback(
    async (conversationId: string) => {
      await handBackConversation({
        variables: { input: { conversationId } },
        refetchQueries: [
          { query: InboxNeedsYouCountDocument },
          'InboxConversations',
          'InboxCounts',
        ],
        awaitRefetchQueries: true,
      });
    },
    [handBackConversation],
  );

  return { handBack, handingBack: loading };
}
